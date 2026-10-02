// Copies spot and blog images off the old imweb CDN into Supabase Storage and
// points the rows at the copies.
//
// Why: every spot photo (thumbnail + gallery) and some blog thumbnails still
// live on cdn.imweb.me as full-size originals — up to 2.7 MB a PNG, 8 MB on the
// homepage alone. That host can't resize, and the images vanish if the imweb
// account ever lapses. In Storage they get the render endpoint's resizing/WebP
// (OptimizedImage) and a one-year cache.
//
//   deno run --allow-env --allow-net scripts/migrate-imweb-images.ts           # dry run: what would move
//   deno run --allow-env --allow-net scripts/migrate-imweb-images.ts --apply   # copy + rewrite the rows
//
// Idempotent: a second run finds nothing left on imweb. A download or upload
// that fails leaves that URL as it was and is listed at the end.
//
// Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from "npm:@supabase/supabase-js@2";

const APPLY = Deno.args.includes("--apply");
const BUCKET = "images";
const IMWEB = /^https?:\/\/cdn\.imweb\.me\//i;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!SUPABASE_URL || !SERVICE) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  Deno.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE, {
  db: { schema: "koreabylocal" },
  auth: { persistSession: false },
});

interface Spot { id: number; slug: string; thumbnail_url: string | null; images: unknown }
interface Post { id: number; slug: string; thumbnail_url: string | null }

const EXT: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif",
};

async function sha(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

const asImages = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

const { data: spots, error: spotsError } = await db.from("experiences").select("id, slug, thumbnail_url, images");
if (spotsError) throw spotsError;
const { data: posts, error: postsError } = await db.from("blog_posts").select("id, slug, thumbnail_url");
if (postsError) throw postsError;

// Each imweb URL once, with the storage folder it should land in.
const todo = new Map<string, string>();
for (const s of (spots ?? []) as Spot[]) {
  for (const u of [s.thumbnail_url, ...asImages(s.images)]) if (u && IMWEB.test(u) && !todo.has(u)) todo.set(u, `spots/${s.id}`);
}
for (const p of (posts ?? []) as Post[]) {
  if (p.thumbnail_url && IMWEB.test(p.thumbnail_url) && !todo.has(p.thumbnail_url)) todo.set(p.thumbnail_url, `blog/${p.id}`);
}

console.log(`${todo.size} imweb image(s) referenced by ${spots?.length ?? 0} spots and ${posts?.length ?? 0} posts.`);
if (todo.size === 0) Deno.exit(0);

if (!APPLY) {
  let bytes = 0;
  let unknown = 0;
  for (const url of todo.keys()) {
    const res = await fetch(url, { method: "HEAD" }).catch(() => null);
    const len = Number(res?.headers.get("content-length"));
    if (len) bytes += len;
    else unknown++;
  }
  console.log(`About ${(bytes / 1024 / 1024).toFixed(1)} MB to copy${unknown ? ` (+${unknown} of unknown size)` : ""}.`);
  console.log("Dry run — nothing changed. Re-run with --apply to copy and rewrite.");
  Deno.exit(0);
}

// ── copy ─────────────────────────────────────────────────────────────────────
const moved = new Map<string, string>();
const failed: string[] = [];
let done = 0;
for (const [url, folder] of todo) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`download ${res.status}`);
    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    const ext = EXT[type] ?? url.split("?")[0].split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${folder}/${await sha(url)}.${ext}`;
    const { error } = await db.storage.from(BUCKET).upload(path, new Uint8Array(await res.arrayBuffer()), {
      contentType: type || undefined,
      cacheControl: "31536000",
      upsert: true,
    });
    if (error) throw new Error(`upload: ${error.message}`);
    moved.set(url, db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
  } catch (err) {
    failed.push(`${url} — ${err instanceof Error ? err.message : err}`);
  }
  if (++done % 20 === 0) console.log(`  ${done}/${todo.size}`);
}

// ── rewrite rows ─────────────────────────────────────────────────────────────
const swap = (u: string | null) => (u && moved.get(u)) || u;
let spotRows = 0;
for (const s of (spots ?? []) as Spot[]) {
  const thumb = swap(s.thumbnail_url);
  const images = Array.isArray(s.images) ? (s.images as unknown[]).map((x) => (typeof x === "string" ? swap(x) : x)) : s.images;
  if (thumb === s.thumbnail_url && JSON.stringify(images) === JSON.stringify(s.images)) continue;
  const { error } = await db.from("experiences").update({ thumbnail_url: thumb, images }).eq("id", s.id);
  if (error) failed.push(`spot ${s.slug}: ${error.message}`);
  else spotRows++;
}
let postRows = 0;
for (const p of (posts ?? []) as Post[]) {
  const thumb = swap(p.thumbnail_url);
  if (thumb === p.thumbnail_url) continue;
  const { error } = await db.from("blog_posts").update({ thumbnail_url: thumb }).eq("id", p.id);
  if (error) failed.push(`post ${p.slug}: ${error.message}`);
  else postRows++;
}

console.log(`Copied ${moved.size}/${todo.size} images; updated ${spotRows} spots and ${postRows} posts.`);
if (failed.length) {
  console.log(`${failed.length} problem(s) — those URLs were left as they were:`);
  for (const f of failed) console.log(`  ${f}`);
}
