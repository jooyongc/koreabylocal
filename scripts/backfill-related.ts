// Computes the recommendation bundle for every published article, once.
//
//   deno run --allow-env --allow-net scripts/backfill-related.ts
//   deno run ... scripts/backfill-related.ts --dry        # judge, print, save nothing
//   deno run ... scripts/backfill-related.ts --only=5     # first five, to sanity-check
//   deno run ... scripts/backfill-related.ts --force      # redo posts that already have one
//
// New articles get theirs from the build-related edge function at publish time;
// this is only for the archive that predates it. Re-running is harmless — each
// bundle is replaced, never appended to.
//
// Needs TYPESAFE_API_KEY, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.

import { buildRelated, type Candidate } from "../supabase/functions/_shared/related.ts";

const arg = (name: string, fallback: string) =>
  Deno.args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1] ?? fallback;

const DRY = Deno.args.includes("--dry");
const FORCE = Deno.args.includes("--force");
const ONLY = Number(arg("only", "0"));

const URL_BASE = Deno.env.get("SUPABASE_URL");
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!URL_BASE || !SERVICE || !Deno.env.get("TYPESAFE_API_KEY")) {
  console.error("SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and TYPESAFE_API_KEY must be set.");
  Deno.exit(2);
}

const rest = (path: string, init?: RequestInit) =>
  fetch(`${URL_BASE}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE, Authorization: `Bearer ${SERVICE}`,
      "Accept-Profile": "koreabylocal", "Content-Profile": "koreabylocal",
      "Content-Type": "application/json", ...(init?.headers ?? {}),
    },
  });

const read = async (path: string) => {
  const r = await rest(path);
  if (!r.ok) { console.error(`${path}: ${r.status} ${await r.text()}`); Deno.exit(1); }
  return await r.json();
};

interface Post { id: number; slug: string; title: string; excerpt: string | null; related: unknown }

const all: Post[] = await read("blog_posts?select=id,slug,title,excerpt,related&status=eq.published&order=id");
const spots = await read("experiences?select=slug,title,tagline&is_active=eq.true");
const products = await read("products?select=slug,title,description");

let targets = FORCE ? all : all.filter((p) => !p.related);
if (ONLY > 0) targets = targets.slice(0, ONLY);

console.log(
  `${all.length} published posts · ${spots.length} spots · ${products.length} products\n` +
    `${targets.length} to compute${DRY ? " (dry run — nothing will be saved)" : ""}\n`,
);

let saved = 0;
let empty = 0;

for (const [i, post] of targets.entries()) {
  const candidates: Candidate[] = [
    ...all.filter((p) => p.id !== post.id)
      .map((p) => ({ kind: "posts" as const, slug: p.slug, title: p.title, summary: p.excerpt })),
    ...spots.map((s: { slug: string; title: string; tagline: string | null }) =>
      ({ kind: "spots" as const, slug: s.slug, title: s.title, summary: s.tagline })),
    ...products.map((p: { slug: string; title: string; description: string | null }) =>
      ({ kind: "products" as const, slug: p.slug, title: p.title, summary: p.description })),
  ];

  const related = await buildRelated(post, candidates);
  if (!related) { console.log(`  ${i + 1}/${targets.length}  FAILED  ${post.title.slice(0, 54)}`); continue; }

  const counts = `${related.posts.length}p ${related.spots.length}s ${related.products.length}x`;
  if (related.posts.length + related.spots.length + related.products.length === 0) empty++;

  if (!DRY) {
    const r = await rest(`blog_posts?id=eq.${post.id}`, { method: "PATCH", body: JSON.stringify({ related }) });
    if (r.ok) saved++;
    else console.error(`  id ${post.id} save failed (${r.status}): ${(await r.text()).slice(0, 120)}`);
  }
  console.log(`  ${i + 1}/${targets.length}  ${counts}  ${post.title.slice(0, 54)}`);
}

console.log(
  `\n${DRY ? "judged" : `saved ${saved}`} · ${empty} article(s) had nothing clear the bar` +
    `${empty ? " — an empty block beats a padded one" : ""}`,
);
