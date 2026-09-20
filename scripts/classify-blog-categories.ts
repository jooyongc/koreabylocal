// Proposes a Guidebook category for every blog post, as a CSV to review.
//
// Why: 51 of 53 posts still carry the imweb-era categories (NEWS, LOCALS,
// KOREAN), while the Guidebook page filters on HOW-TO / LOCAL-LIFE / K-CULTURE
// / FESTIVAL / FOOD / TRANSPORT with an exact match. Five of those six filters
// currently return nothing at all.
//
//   deno run --allow-env --allow-net --allow-write scripts/classify-blog-categories.ts
//   deno run ... scripts/classify-blog-categories.ts --out=proposals.csv --min=0.8
//   deno run ... scripts/classify-blog-categories.ts --apply
//
// Writes a CSV and changes nothing by default. --apply updates only the rows
// at or above the confidence bar; anything below stays for a human, because a
// confidently wrong category is worse than the honest mess we have now.
//
// Needs TYPESAFE_API_KEY, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.

import { asChoice, choice, judge } from "../supabase/functions/_shared/typesafe.ts";

const arg = (name: string, fallback: string) =>
  Deno.args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1] ?? fallback;

const OUT = arg("out", "blog-category-proposals.csv");
const MIN_CONFIDENCE = Number(arg("min", "0.75"));
const BATCH = Number(arg("batch", "20"));
const APPLY = Deno.args.includes("--apply");

// The values the Guidebook page actually filters on. Descriptions are what the
// model reads, so they carry the disambiguation: a how-to about trains is
// TRANSPORT, because that is the shelf a reader looks on.
const CATEGORIES: Record<string, string> = {
  "TRANSPORT": "getting around Korea: flights, airports, trains, buses, subway, taxis, transit cards, transfers — including how-to guides about any of these",
  "FOOD": "what or where to eat and drink, dishes, restaurants, cafes, markets, groceries",
  "FESTIVAL": "a specific festival, seasonal event, holiday or celebration and when to attend it",
  "K-CULTURE": "K-pop, drama, film, celebrities, the Korean language, literature, history and traditions",
  "HOW-TO": "practical step-by-step instructions that are not about getting around: shopping, apps, SIMs, money, refunds, paperwork, what to do when something goes wrong",
  "LOCAL-LIFE": "what life in Korea is actually like: neighbourhoods, everyday habits, etiquette, living here long-term, personal local perspective",
};

interface Post {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  category: string;
  status: string;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!SUPABASE_URL || !SERVICE) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  Deno.exit(2);
}
if (!Deno.env.get("TYPESAFE_API_KEY")) {
  console.error("TYPESAFE_API_KEY must be set.");
  Deno.exit(2);
}

const rest = (path: string, init?: RequestInit) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE,
      Authorization: `Bearer ${SERVICE}`,
      "Accept-Profile": "koreabylocal",
      "Content-Profile": "koreabylocal",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

const res = await rest("blog_posts?select=id,slug,title,excerpt,category,status&order=id");
if (!res.ok) {
  console.error(`Could not read blog_posts (${res.status}): ${await res.text()}`);
  Deno.exit(1);
}
const posts = (await res.json()) as Post[];
console.log(`${posts.length} posts\n`);

interface Proposal {
  post: Post;
  proposed: string;
  confidence: number;
}

const proposals: Proposal[] = [];
let tokens = 0;

for (let i = 0; i < posts.length; i += BATCH) {
  const batch = posts.slice(i, i + BATCH);
  const articles: Record<string, { title: string; summary: string }> = {};
  const questions: Record<string, ReturnType<typeof choice>> = {};

  batch.forEach((p, n) => {
    const id = `a${n + 1}`;
    articles[id] = { title: p.title, summary: (p.excerpt ?? "").slice(0, 300) };
    questions[id] = choice(
      `Which section of a Korea travel guidebook does the article described in \`articles.${id}\` belong in?`,
      CATEGORIES,
    );
  });

  const judged = await judge({ articles }, questions);
  if (!judged.ok) {
    console.error(`batch ${i / BATCH + 1} failed: ${judged.error} — ${judged.message}`);
    Deno.exit(1);
  }
  tokens += judged.usage.input_tokens;

  batch.forEach((p, n) => {
    const a = asChoice(judged.answers[`a${n + 1}`]);
    if (a) proposals.push({ post: p, proposed: a.choice, confidence: a.confidence });
  });
  console.log(`  batch ${i / BATCH + 1}: ${batch.length} posts, ${judged.ms}ms`);
}

const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const confident = proposals.filter((p) => p.confidence >= MIN_CONFIDENCE);
const unchanged = proposals.filter((p) => p.post.category === p.proposed);

const rows = [
  ["id", "slug", "status", "current", "proposed", "confidence", "decision", "title"].join(","),
  ...proposals
    .slice()
    .sort((a, b) => a.confidence - b.confidence)
    .map((p) =>
      [
        p.post.id, p.post.slug, p.post.status, p.post.category, p.proposed,
        p.confidence.toFixed(2),
        p.post.category === p.proposed ? "no change" : p.confidence >= MIN_CONFIDENCE ? "apply" : "review by hand",
        p.post.title,
      ].map(csvCell).join(","),
    ),
];
await Deno.writeTextFile(OUT, rows.join("\n") + "\n");

const byCategory = new Map<string, number>();
for (const p of proposals) byCategory.set(p.proposed, (byCategory.get(p.proposed) ?? 0) + 1);

console.log(`\nProposed distribution:`);
for (const [cat, n] of [...byCategory].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cat.padEnd(12)} ${n}`);
}
console.log(
  `\n${proposals.length} judged · ${confident.length} at or above ${MIN_CONFIDENCE} confidence · ` +
    `${proposals.length - confident.length} for a human · ${unchanged.length} already correct`,
);
console.log(`${tokens} input tokens ($${(tokens * 0.042 / 1_000_000).toFixed(4)})`);
console.log(`\nWrote ${OUT}`);

if (!APPLY) {
  console.log("Nothing was changed. Review the CSV, then re-run with --apply.");
  Deno.exit(0);
}

const toApply = confident.filter((p) => p.post.category !== p.proposed);
console.log(`\nApplying ${toApply.length} change(s)…`);
let done = 0;
for (const p of toApply) {
  const r = await rest(`blog_posts?id=eq.${p.post.id}`, {
    method: "PATCH",
    body: JSON.stringify({ category: p.proposed }),
  });
  if (r.ok) done++;
  else console.error(`  id ${p.post.id} failed (${r.status}): ${(await r.text()).slice(0, 120)}`);
}
console.log(`Updated ${done}/${toApply.length}.`);
