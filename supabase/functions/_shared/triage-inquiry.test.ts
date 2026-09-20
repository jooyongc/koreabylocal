// deno test --allow-env supabase/functions/_shared/triage-inquiry.test.ts
import { assert, assertEquals } from "jsr:@std/assert@1";
import { triageInquiry, type TriagePost } from "./triage-inquiry.ts";
import type { Answer, JudgeResult, Question } from "./typesafe.ts";

const POSTS: TriagePost[] = [
  { slug: "airport-bus", title: "Free Transit Tour at Incheon International Airport", excerpt: "Airport buses and how to book" },
  { slug: "ktx", title: "How to Book KTX Trains in Korea", excerpt: "KORAIL Pass walkthrough" },
  { slug: "kimchi", title: "Korean Kimchi and where to buy", excerpt: "Markets and supermarkets" },
];

const ok = (answers: Record<string, Answer>): JudgeResult => ({
  ok: true, answers, usage: { input_tokens: 100, output_tokens: 10 }, model: "jev-1.13.0", ms: 220,
});

function scriptedJudge(result: JudgeResult) {
  const calls: Array<{ state: unknown; questions: Record<string, Question>; opts?: { timeoutMs?: number; retries?: number } }> = [];
  const judge = (state: unknown, questions: Record<string, Question>, opts?: { timeoutMs?: number; retries?: number }) => {
    calls.push({ state, questions, opts });
    return Promise.resolve(result);
  };
  return { judge, calls };
}

const scored = (n: number): Answer => ({ type: "score", score: n, legend: {}, probabilities: {}, confidence: 0.8 });
const at = () => new Date("2026-09-20T00:00:00.000Z");

Deno.test("triageInquiry() returns null for an empty message without calling out", async () => {
  const { judge, calls } = scriptedJudge(ok({}));
  assertEquals(await triageInquiry("", POSTS, { judge }), null);
  assertEquals(await triageInquiry("   ", POSTS, { judge }), null);
  assertEquals(calls.length, 0);
});

Deno.test("triageInquiry() reads category, urgency and related guides", async () => {
  const { judge } = scriptedJudge(ok({
    category: { type: "choice", choice: "Transport", probabilities: {}, confidence: 0.97 },
    urgent: { type: "noul", noul: 0.9 },
    c1: scored(2.6),
    c2: scored(1.8),
    c3: scored(0.2),
  }));

  const triage = await triageInquiry("I land at Incheon tomorrow at 06:00, are the buses running?", POSTS, { judge, now: at });

  assert(triage);
  assertEquals(triage.category, "Transport");
  assertEquals(triage.category_confidence, 0.97);
  assertEquals(triage.urgent, true);
  assertEquals(triage.model, "jev-1.13.0");
  assertEquals(triage.at, "2026-09-20T00:00:00.000Z");
  assertEquals(triage.related.map((r) => r.slug), ["airport-bus", "ktx"], "sorted by score, weak match dropped");
  assertEquals(triage.related[0].score, 2.6);
});

Deno.test("triageInquiry() never sends the asker's name or email", async () => {
  const { judge, calls } = scriptedJudge(ok({ category: { type: "choice", choice: "Food", probabilities: {}, confidence: 1 }, urgent: { type: "noul", noul: 0 } }));
  await triageInquiry("Where can I eat vegan food in Hongdae?", POSTS, { judge });

  const sent = JSON.stringify(calls[0].state);
  assertEquals((calls[0].state as { question: string }).question, "Where can I eat vegan food in Hongdae?");
  assert(!sent.includes("@"), "no email address may reach the judgement");
  assertEquals(Object.keys(calls[0].state as object).sort(), ["candidates", "question"]);
});

Deno.test("triageInquiry() runs inside the webhook budget: one call, short timeout, no retries", async () => {
  const { judge, calls } = scriptedJudge(ok({ urgent: { type: "noul", noul: 0.1 } }));
  await triageInquiry("Any tips?", POSTS, { judge });

  assertEquals(calls.length, 1, "a payment webhook gets one round trip");
  assertEquals(calls[0].opts?.timeoutMs, 5000);
  assertEquals(calls[0].opts?.retries, 0);
});

Deno.test("triageInquiry() returns null when the judgement fails", async () => {
  const { judge } = scriptedJudge({ ok: false, error: "timeout", message: "no response within 5000ms" });
  assertEquals(await triageInquiry("Anything", POSTS, { judge }), null);
});

Deno.test("triageInquiry() treats missing answers as not urgent and uncategorised", async () => {
  const { judge } = scriptedJudge(ok({}));
  const triage = await triageInquiry("Anything", POSTS, { judge, now: at });
  assert(triage);
  assertEquals(triage.urgent, false, "an absent answer must not raise a false alarm");
  assertEquals(triage.category, null);
  assertEquals(triage.category_confidence, null);
  assertEquals(triage.related, []);
});

Deno.test("triageInquiry() treats a below-threshold urgency as not urgent", async () => {
  const { judge } = scriptedJudge(ok({ urgent: { type: "noul", noul: 0.49 } }));
  const triage = await triageInquiry("Anything", POSTS, { judge });
  assertEquals(triage?.urgent, false);
});

Deno.test("triageInquiry() works with no published posts to match against", async () => {
  const { judge, calls } = scriptedJudge(ok({ urgent: { type: "noul", noul: 0.8 } }));
  const triage = await triageInquiry("Anything", [], { judge });

  assert(triage);
  assertEquals(triage.related, []);
  assertEquals(Object.keys(calls[0].questions).sort(), ["category", "urgent"], "no candidate questions");
  assertEquals((calls[0].state as { candidates?: unknown }).candidates, undefined);
});

Deno.test("triageInquiry() caps related guides at three", async () => {
  const many: TriagePost[] = Array.from({ length: 10 }, (_, i) => ({
    slug: `p-${i}`, title: `Guide ${i}`, excerpt: "about buses and trains",
  }));
  const answers: Record<string, Answer> = { urgent: { type: "noul", noul: 0 } };
  many.forEach((_, i) => { answers[`c${i + 1}`] = scored(2.9 - i * 0.01); });

  const triage = await triageInquiry("buses and trains", many, { judge: scriptedJudge(ok(answers)).judge });
  assertEquals(triage?.related.length, 3);
});

Deno.test("triageInquiry() pre-filters a large archive down to 30 candidates", async () => {
  const many: TriagePost[] = Array.from({ length: 120 }, (_, i) => ({
    slug: `p-${i}`, title: `Unrelated guide ${i}`, excerpt: "nothing to do with it",
  }));
  many.push({ slug: "pharmacy", title: "A Korean pharmacy guide", excerpt: "buying medicine" });

  const { judge, calls } = scriptedJudge(ok({ urgent: { type: "noul", noul: 0 } }));
  await triageInquiry("Where is a pharmacy for buying medicine?", many, { judge });

  const candidates = (calls[0].state as { candidates: Record<string, unknown> }).candidates;
  assertEquals(Object.keys(candidates).length, 30);
  const titles = JSON.stringify(candidates);
  assert(titles.includes("pharmacy guide"), "the relevant guide survives the pre-filter");
});

Deno.test("triageInquiry() truncates long excerpts so state stays small", async () => {
  const long: TriagePost[] = [{ slug: "x", title: "T", excerpt: "y".repeat(900) }];
  const { judge, calls } = scriptedJudge(ok({ urgent: { type: "noul", noul: 0 } }));
  await triageInquiry("question", long, { judge });

  const candidates = (calls[0].state as { candidates: Record<string, { summary: string }> }).candidates;
  assertEquals(candidates.c1.summary.length, 300);
});
