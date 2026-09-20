// Adds affiliate disclosure + CTAs to articles published before this existed.
//
//   deno run --allow-env --allow-net scripts/backfill-affiliates.ts --dry
//   deno run --allow-env --allow-net scripts/backfill-affiliates.ts
//   deno run ... --only=5        # first five, to eyeball the output
//   deno run ... --redo          # re-judge articles that already have blocks
//
// Safe to re-run: applyAffiliates strips its own previous blocks before adding
// new ones, so an article never accumulates disclosures. New articles get this
// from generate-article; this is only for the back catalogue.
//
// Needs TYPESAFE_API_KEY, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.

import { applyAffiliates, activePrograms, hasAffiliates } from "../supabase/functions/_shared/affiliate.ts";

const arg = (name: string, fallback: string) =>
  Deno.args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1] ?? fallback;

const DRY = Deno.args.includes("--dry");
const REDO = Deno.args.includes("--redo");
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

interface Post { id: number; slug: string; title: string; excerpt: string | null; content: string | null }

const r = await rest("blog_posts?select=id,slug,title,excerpt,content&status=eq.published&order=id");
if (!r.ok) { console.error(`read failed (${r.status}): ${await r.text()}`); Deno.exit(1); }
const all = (await r.json()) as Post[];

const programs = activePrograms();
console.log(`Active programs: ${programs.map((p) => p.id).join(", ") || "(none)"}\n`);
if (programs.length === 0) {
  console.error("No affiliate program is configured — nothing to insert.");
  Deno.exit(1);
}

let targets = all.filter((p) => p.content && (REDO || !hasAffiliates(p.content)));
if (ONLY > 0) targets = targets.slice(0, ONLY);

console.log(`${all.length} published · ${targets.length} to process${DRY ? " (dry run — nothing saved)" : ""}\n`);

const tally = new Map<string, number>();
let changed = 0;
let none = 0;

for (const [i, post] of targets.entries()) {
  const { html, programs: picked } = await applyAffiliates({
    title: post.title, html: post.content ?? "", excerpt: post.excerpt,
  });

  for (const id of picked) tally.set(id, (tally.get(id) ?? 0) + 1);
  if (picked.length === 0) none++;

  const label = picked.length ? picked.join("+") : "—";
  console.log(`  ${i + 1}/${targets.length}  ${label.padEnd(18)} ${post.title.slice(0, 52)}`);

  if (DRY || html === post.content) continue;
  const up = await rest(`blog_posts?id=eq.${post.id}`, { method: "PATCH", body: JSON.stringify({ content: html }) });
  if (up.ok) changed++;
  else console.error(`    id ${post.id} save failed (${up.status}): ${(await up.text()).slice(0, 120)}`);
}

console.log(`\nby program: ${[...tally].map(([k, v]) => `${k} ${v}`).join(" · ") || "none"}`);
console.log(`${none} article(s) got nothing — no program fitted, which is the right answer for some.`);
console.log(DRY ? "Dry run: nothing was saved." : `Saved ${changed} article(s).`);
