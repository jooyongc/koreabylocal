// Makes the resized WebP copies every public image is owed, here with sharp
// (libvips, the library behind Supabase's own resizer), so it uses none of the
// plan's image-transformation quota. The backfill, and the catch-up when the
// image-variants edge function has hit its monthly budget.
// See supabase/migrations/20261115000000_image_variants.sql.
//
//   node scripts/image-variants.mjs --dry        # list what is owed
//   node scripts/image-variants.mjs --limit=5    # make five
//   node scripts/image-variants.mjs              # make all
//
// Needs SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY, and
// sharp, which the app itself doesn't depend on: `npm i --no-save sharp` first.
import sharp from "sharp";

// Keep in step with src/lib/imageUrl.ts and supabase/functions/image-variants.
const WIDTHS = [400, 600, 800, 1200, 1920];
const QUALITY = 75;
const CONCURRENCY = 4;

const base = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!base || !key) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  process.exit(2);
}
const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const dry = process.argv.includes("--dry");
const limit = Number(arg("limit") ?? 100000);

const auth = { apikey: key, Authorization: `Bearer ${key}` };
const profile = { "Accept-Profile": "koreabylocal", "Content-Profile": "koreabylocal" };
const encode = (name) => name.split("/").map(encodeURIComponent).join("/");

async function call(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${url.replace(base, "")}: ${res.status} ${(await res.text()).slice(0, 200)}`);
  return res;
}

const pending = await (await call(`${base}/rest/v1/rpc/image_variants_pending`, {
  method: "POST",
  headers: { ...auth, ...profile, "Content-Type": "application/json" },
  body: JSON.stringify({ max_rows: limit }),
})).json();

console.log(`${pending.length} image(s) owed copies`);
if (dry) {
  for (const p of pending.slice(0, 20)) console.log(`  ${p.bucket}/${p.name}`);
  process.exit(0);
}

let done = 0, failed = 0, bytesIn = 0, bytesOut = 0;

async function makeCopies(image) {
  const original = Buffer.from(await (await call(`${base}/storage/v1/object/public/${image.bucket}/${encode(image.name)}`)).arrayBuffer());
  // rotate() applies the EXIF orientation, as Supabase's resizer does.
  const decoded = sharp(original, { failOn: "none" }).rotate();
  let out = 0;
  for (const width of WIDTHS) {
    const copy = await decoded.clone().resize({ width, withoutEnlargement: true }).webp({ quality: QUALITY }).toBuffer();
    out += copy.length;
    await call(`${base}/storage/v1/object/images/_v/${image.bucket}/${encode(image.name)}.w${width}.webp`, {
      method: "POST",
      headers: { ...auth, "Content-Type": "image/webp", "Cache-Control": "max-age=31536000", "x-upsert": "true" },
      body: copy,
    });
  }
  await call(`${base}/rest/v1/image_variants?on_conflict=bucket,name`, {
    method: "POST",
    headers: { ...auth, ...profile, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      bucket: image.bucket, name: image.name, source_updated_at: image.source_updated_at,
      via: "sharp", error: null, made_at: new Date().toISOString(),
    }),
  });
  bytesIn += original.length;
  bytesOut += out;
}

const queue = [...pending];
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  for (let image = queue.shift(); image; image = queue.shift()) {
    try {
      await makeCopies(image);
      done++;
    } catch (e) {
      failed++;
      console.error(`  failed ${image.bucket}/${image.name}: ${e.message}`);
    }
    if ((done + failed) % 25 === 0) console.log(`  ${done + failed}/${pending.length}`);
  }
}));

const mb = (b) => (b / 1e6).toFixed(1);
console.log(`made ${done}, failed ${failed}; originals ${mb(bytesIn)} MB -> all ${WIDTHS.length} copies ${mb(bytesOut)} MB`);
if (failed) process.exit(1);
