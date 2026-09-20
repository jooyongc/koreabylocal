// Scores the TypeSafe (Jev) judgements this repo relies on against labelled
// cases, using the real API. Kept out of supabase/functions/_shared/*.test.ts
// so `deno test` stays offline and free.
//
//   deno run --allow-env --allow-net scripts/typesafe-eval.ts
//   deno run --allow-env --allow-net scripts/typesafe-eval.ts --suite=topics
//   deno run --allow-env --allow-net scripts/typesafe-eval.ts --threshold=0.4
//
// Needs TYPESAFE_API_KEY. If SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are
// also set, the duplicate suite judges candidates against every real post
// title instead of the bundled sample — that is the run to trust when tuning
// the KT-01 threshold. Exits non-zero if any labelled case is judged wrong.

import { asChoice, asNoul, choice, judge, noul } from "../supabase/functions/_shared/typesafe.ts";

const arg = (name: string, fallback: string) =>
  Deno.args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1] ?? fallback;

const THRESHOLD = Number(arg("threshold", "0.5"));
const SUITE = arg("suite", "all");
const PRICE_PER_INPUT_TOKEN = 0.042 / 1_000_000;

// Sample of live koreabylocal.com posts (slugs read from the sitemap
// 2026-09-20), used when no database credentials are present.
const SAMPLE_POSTS = [
  "No cash on buses: how to use the bus in Korea (update guide)",
  "Cash-free bus and T-money card",
  "How to stay connected in Korea",
  "How to rent and book WiFi in Korea: Incheon, Daegu, Gimhae, Gimpo, Cheongju",
  "Shop like a local in Korea: Daiso",
  "Can foreigners visit the DMZ? How to go",
  "Must-visit cafes in Seoul: a local's guide by a Korean",
  "How to book KTX trains in Korea: the ultimate guide to the Korail Pass",
  "How to book intercity buses online: a complete guide for travelers",
  "Best day trips from Seoul by train",
  "Is tipping required in Korea?",
  "Can I use Uber in Korea?",
  "Lost wallet in Seoul subway: complete guide",
  "7 must-have apps for living and traveling in Korea",
  "2026 South Korea public holidays: a complete guide for travelers",
  "Free transit tour at Incheon International Airport and how to book",
];

async function loadPosts(): Promise<{ titles: string[]; source: string }> {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return { titles: SAMPLE_POSTS, source: `bundled sample (${SAMPLE_POSTS.length})` };

  const res = await fetch(`${url}/rest/v1/blog_posts?select=title`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Accept-Profile": "koreabylocal" },
  });
  if (!res.ok) {
    console.warn(`  ! could not read blog_posts (${res.status}) — falling back to the bundled sample`);
    return { titles: SAMPLE_POSTS, source: `bundled sample (${SAMPLE_POSTS.length})` };
  }
  const rows = (await res.json()) as Array<{ title: string }>;
  return { titles: rows.map((r) => r.title), source: `live blog_posts (${rows.length})` };
}

// ---------------------------------------------------------------- suite: topics

// The six §2 cases. "duplicate" means an existing post already serves the same
// reader intent — a shared broad theme (cafes, trains) is not a duplicate.
const TOPIC_CASES: Array<{ title: string; duplicate: boolean }> = [
  { title: "How to pay for buses in Korea without cash (T-money guide)", duplicate: true },
  { title: "Best eSIM and pocket WiFi options for Korea travelers", duplicate: true },
  { title: "What to buy at Daiso Korea: 15 traveler favorites", duplicate: true },
  { title: "Is it safe to join a DMZ tour as a foreigner?", duplicate: true },
  { title: "A local's guide to Busan's Haeridan-gil cafes", duplicate: false },
  { title: "How to take the KTX from Seoul to Busan", duplicate: false },
];

async function runTopics(): Promise<{ passed: number; total: number; tokens: number }> {
  const { titles, source } = await loadPosts();
  console.log(`\n── Topic duplication · ${source} · threshold ${THRESHOLD}`);

  const candidates: Record<string, string> = {};
  const questions: Record<string, ReturnType<typeof noul>> = {};
  TOPIC_CASES.forEach((c, i) => {
    const id = `t${i + 1}`;
    candidates[id] = c.title;
    questions[id] = noul(
      `Would an article titled \`candidates.${id}\` substantially duplicate the topic of any article in \`existing_posts\`?`,
      {
        true: "An existing post already covers the same topic and reader intent",
        false: "No existing post covers this topic, or it only shares a broad theme",
      },
    );
  });

  const res = await judge({ existing_posts: titles, candidates }, questions);
  if (!res.ok) {
    console.error(`  FAILED: ${res.error} — ${res.message}`);
    return { passed: 0, total: TOPIC_CASES.length, tokens: 0 };
  }

  let passed = 0;
  for (const [i, c] of TOPIC_CASES.entries()) {
    const answer = asNoul(res.answers[`t${i + 1}`]);
    const p = answer?.noul ?? NaN;
    const got = p >= THRESHOLD;
    const ok = got === c.duplicate;
    if (ok) passed++;
    const label = c.duplicate ? "duplicate" : "new";
    console.log(`  ${ok ? "ok  " : "FAIL"}  p=${p.toFixed(2)}  expected ${label.padEnd(9)}  ${c.title}`);
  }
  console.log(`  ${passed}/${TOPIC_CASES.length} correct · ${res.ms}ms · ${res.usage.input_tokens} input tokens · ${res.model}`);
  return { passed, total: TOPIC_CASES.length, tokens: res.usage.input_tokens };
}

// --------------------------------------------------------------- suite: inquiries

const CATEGORIES: Record<string, string | null> = {
  Transport: "getting around: flights, buses, trains, subway, transfers, airport",
  Itinerary: "planning a trip: where to go, how many days, routing",
  Food: "what and where to eat or drink",
  Shopping: "what to buy and where",
  Culture: "customs, etiquette, language, history, events",
  Spam: "advertising, link selling, or anything not a genuine travel question",
  Other: null,
};

const INQUIRY_CASES: Array<{ id: string; message: string; category: string; urgent: boolean }> = [
  {
    id: "m1",
    message:
      "I land at Incheon tomorrow at 06:00 and need to get to Myeongdong. Are the airport buses running that early, and where do I buy a ticket?",
    category: "Transport",
    urgent: true,
  },
  {
    id: "m2",
    message:
      "We are a family of five planning seven days in Korea next spring. Could you suggest an itinerary that mixes Seoul with somewhere quieter?",
    category: "Itinerary",
    urgent: false,
  },
  {
    id: "m3",
    message: "Boost your followers fast! We sell real Instagram followers at the lowest price, click here for our packages.",
    category: "Spam",
    urgent: false,
  },
  {
    id: "m4",
    message: "Can you recommend vegan Korean restaurants near Hongdae? I am visiting next month.",
    category: "Food",
    urgent: false,
  },
];

async function runInquiries(): Promise<{ passed: number; total: number; tokens: number }> {
  console.log(`\n── Inquiry triage · ${INQUIRY_CASES.length} messages · threshold ${THRESHOLD}`);

  const messages: Record<string, string> = {};
  const questions: Record<string, ReturnType<typeof noul> | ReturnType<typeof choice>> = {};
  for (const c of INQUIRY_CASES) {
    messages[c.id] = c.message;
    questions[`${c.id}_category`] = choice(
      `Which category best describes the traveler's question in \`messages.${c.id}\`?`,
      CATEGORIES,
    );
    questions[`${c.id}_urgent`] = noul(
      `Does \`messages.${c.id}\` need an answer within 48 hours because the traveler's trip is imminent or already underway?`,
    );
  }

  const res = await judge({ messages }, questions);
  if (!res.ok) {
    console.error(`  FAILED: ${res.error} — ${res.message}`);
    return { passed: 0, total: INQUIRY_CASES.length * 2, tokens: 0 };
  }

  let passed = 0;
  for (const c of INQUIRY_CASES) {
    const cat = asChoice(res.answers[`${c.id}_category`]);
    const urg = asNoul(res.answers[`${c.id}_urgent`]);
    const catOk = cat?.choice === c.category;
    const urgOk = (urg?.noul ?? NaN) >= THRESHOLD === c.urgent;
    if (catOk) passed++;
    if (urgOk) passed++;
    console.log(
      `  ${catOk ? "ok  " : "FAIL"}  ${(cat?.choice ?? "?").padEnd(9)} (conf ${(cat?.confidence ?? 0).toFixed(2)})  expected ${c.category}`,
    );
    console.log(
      `  ${urgOk ? "ok  " : "FAIL"}  urgent p=${(urg?.noul ?? NaN).toFixed(2)}              expected ${c.urgent}   "${c.message.slice(0, 48)}…"`,
    );
  }
  const total = INQUIRY_CASES.length * 2;
  console.log(`  ${passed}/${total} correct · ${res.ms}ms · ${res.usage.input_tokens} input tokens · ${res.model}`);
  return { passed, total, tokens: res.usage.input_tokens };
}

// ------------------------------------------------------------------- self-test

async function selfTest() {
  const saved = Deno.env.get("TYPESAFE_API_KEY");
  Deno.env.delete("TYPESAFE_API_KEY");
  const res = await judge("anything", { q: noul("Is this reached?") });
  if (saved !== undefined) Deno.env.set("TYPESAFE_API_KEY", saved);

  const ok = !res.ok && res.error === "not_configured";
  console.log(`\n── Degraded mode\n  ${ok ? "ok  " : "FAIL"}  no key → ${res.ok ? "called the API anyway" : res.error}`);
  return ok;
}

// ------------------------------------------------------------------------ main

if (!Deno.env.get("TYPESAFE_API_KEY")) {
  console.error("TYPESAFE_API_KEY is not set — nothing to evaluate.");
  Deno.exit(2);
}

let passed = 0;
let total = 0;
let tokens = 0;

if (SUITE === "all" || SUITE === "topics") {
  const r = await runTopics();
  passed += r.passed; total += r.total; tokens += r.tokens;
}
if (SUITE === "all" || SUITE === "inquiries") {
  const r = await runInquiries();
  passed += r.passed; total += r.total; tokens += r.tokens;
}

const degradedOk = await selfTest();

console.log(
  `\n${passed}/${total} labelled cases correct · ${tokens} input tokens · $${(tokens * PRICE_PER_INPUT_TOKEN).toFixed(6)}`,
);
Deno.exit(passed === total && degradedOk ? 0 : 1);
