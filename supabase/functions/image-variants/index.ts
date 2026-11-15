// Makes the resized WebP copies a newly uploaded image is owed, so visitors
// get a stored file instead of an on-the-fly resize (see
// supabase/migrations/20261115000000_image_variants.sql). pg_cron calls it
// every 5 minutes; deployed with --no-verify-jwt — it takes no input and can
// only make copies that are owed anyway.
//
// It resizes through Supabase's own resizer, the one that served the site
// before, so the copies look exactly as the pages did. That is billed per
// original image per month (Pro includes 100), so it stops at BUDGET in any
// 31 days; anything past that shows as the original until the window moves on
// or scripts/image-variants.mjs (local, sharp, no quota) catches it up.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Keep in step with src/lib/imageUrl.ts and scripts/image-variants.mjs.
const WIDTHS = [400, 600, 800, 1200, 1920];
const QUALITY = 75;
const BUDGET = 80;
const PER_RUN = 4;

const base = Deno.env.get("SUPABASE_URL")!;
const db = createClient(base, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  db: { schema: "koreabylocal" },
  auth: { persistSession: false },
});

type Pending = { bucket: string; name: string; source_updated_at: string };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const { data: used, error: usedError } = await db.rpc("image_variants_rendered_recently");
  if (usedError) return json({ error: usedError.message }, 500);
  const room = Math.min(PER_RUN, BUDGET - (used ?? 0));
  if (room <= 0) return json({ made: [], waiting: "budget", used });

  const { data: pending, error: pendingError } = await db.rpc("image_variants_pending", { max_rows: room });
  if (pendingError) return json({ error: pendingError.message }, 500);

  const made: string[] = [];
  const failed: { image: string; error: string }[] = [];
  for (const image of (pending ?? []) as Pending[]) {
    const id = `${image.bucket}/${image.name}`;
    let error: string | null = null;
    try {
      await makeCopies(image);
      made.push(id);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      failed.push({ image: id, error });
    }
    // A failure is recorded too, so one bad file can't hold up the queue; the
    // pending list offers it again a day later.
    const { error: saveError } = await db.from("image_variants").upsert({
      bucket: image.bucket,
      name: image.name,
      source_updated_at: image.source_updated_at,
      via: "render",
      error,
      made_at: new Date().toISOString(),
    });
    if (saveError) failed.push({ image: id, error: `record: ${saveError.message}` });
  }

  return json({ made, failed, used: (used ?? 0) + (pending?.length ?? 0) });
});

async function makeCopies(image: Pending) {
  const path = image.name.split("/").map(encodeURIComponent).join("/");
  for (const width of WIDTHS) {
    const res = await fetch(
      `${base}/storage/v1/render/image/public/${image.bucket}/${path}?width=${width}&quality=${QUALITY}&resize=contain`,
      { headers: { Accept: "image/webp" } },
    );
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || type !== "image/webp") {
      throw new Error(`resize to ${width}: ${res.status} ${type} ${(await res.text()).slice(0, 200)}`);
    }
    const { error } = await db.storage
      .from("images")
      .upload(`_v/${image.bucket}/${image.name}.w${width}.webp`, await res.arrayBuffer(), {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: true,
      });
    if (error) throw new Error(`upload ${width}: ${error.message}`);
  }
}
