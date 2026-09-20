// deno test --allow-env supabase/functions/_shared/duplicate-topics.test.ts
import { assert, assertEquals } from "jsr:@std/assert@1";
import { findDuplicates, type Post, type Topic } from "./duplicate-topics.ts";
import type { Answer, JudgeResult, Question } from "./typesafe.ts";

const topic = (title: string): Topic => ({ title, keywords: [], intent: "informational", category: "Transport", rationale: "" });

const POSTS: Post[] = [
  { title: "How to Book KTX Trains in Korea: The Ultimate Guide to the KORAIL Pass", slug: "how-to-book-ktx" },
  { title: "Cash Free Bus and T-money Card", slug: "cash-free-bus" },
  { title: "Must-Visit Cafes in Seoul, A Local's Guide by a Korean", slug: "seoul-cafes" },
];

const ok = (answers: Record<string, Answer>): JudgeResult => ({
  ok: true, answers, usage: { input_tokens: 100, output_tokens: 10 }, model: "jev-1.13.0", ms: 200,
});

const fail = (error: "not_configured" | "timeout"): JudgeResult => ({ ok: false, error, message: error });

/** Replays scripted results and records what each call was asked. */
function scriptedJudge(results: JudgeResult[]) {
  const calls: Array<{ state: unknown; questions: Record<string, Question> }> = [];
  const judge = (state: unknown, questions: Record<string, Question>) => {
    calls.push({ state, questions });
    return Promise.resolve(results[Math.min(calls.length - 1, results.length - 1)]);
  };
  return { judge, calls };
}

Deno.test("findDuplicates() skips the check when there is nothing to compare", async () => {
  const { judge, calls } = scriptedJudge([ok({})]);
  assertEquals(await findDuplicates([], POSTS, { judge }), { duplicates: [], checked: false });
  assertEquals(await findDuplicates([topic("x")], [], { judge }), { duplicates: [], checked: false });
  assertEquals(calls.length, 0, "no posts or no topics means no request at all");
});

Deno.test("findDuplicates() flags topics over the threshold and names the post", async () => {
  const { judge, calls } = scriptedJudge([
    ok({ t1: { type: "noul", noul: 0.91 }, t2: { type: "noul", noul: 0.08 } }),
    ok({ t1: { type: "choice", choice: "how-to-book-ktx", probabilities: {}, confidence: 0.93 } }),
  ]);

  const { duplicates, checked } = await findDuplicates(
    [topic("Booking KTX tickets with the KORAIL Pass"), topic("Renting a car on Jeju")],
    POSTS,
    { judge, threshold: 0.4 },
  );

  assertEquals(checked, true);
  assertEquals(duplicates[0], {
    probability: 0.91,
    of_title: "How to Book KTX Trains in Korea: The Ultimate Guide to the KORAIL Pass",
    of_slug: "how-to-book-ktx",
  });
  assertEquals(duplicates[1], null, "a clean topic carries no verdict");

  // Only the flagged topic goes to the attribution pass.
  assertEquals(Object.keys(calls[1].questions), ["t1"]);
  assertEquals(calls[1].questions.t1.type, "choice");
});

Deno.test("findDuplicates() honours the threshold", async () => {
  const answers = { t1: { type: "noul", noul: 0.35 } } as Record<string, Answer>;
  const under = await findDuplicates([topic("x")], POSTS, { judge: scriptedJudge([ok(answers)]).judge, threshold: 0.4 });
  assertEquals(under.duplicates[0], null);

  const over = await findDuplicates([topic("x")], POSTS, {
    judge: scriptedJudge([ok(answers), ok({})]).judge,
    threshold: 0.3,
  });
  assert(over.duplicates[0]);
});

Deno.test("findDuplicates() reports checked:false when the first pass fails", async () => {
  const { judge, calls } = scriptedJudge([fail("not_configured")]);
  const res = await findDuplicates([topic("x")], POSTS, { judge });
  assertEquals(res, { duplicates: [], checked: false });
  assertEquals(calls.length, 1, "a dead first pass must not trigger attribution");
});

Deno.test("findDuplicates() keeps the probability when only attribution fails", async () => {
  const { judge } = scriptedJudge([ok({ t1: { type: "noul", noul: 0.88 } }), fail("timeout")]);
  const { duplicates, checked } = await findDuplicates([topic("x")], POSTS, { judge });
  assertEquals(checked, true);
  assertEquals(duplicates[0], { probability: 0.88, of_title: null, of_slug: null });
});

Deno.test("findDuplicates() survives a choice that names an unknown slug", async () => {
  const { judge } = scriptedJudge([
    ok({ t1: { type: "noul", noul: 0.7 } }),
    ok({ t1: { type: "choice", choice: "a-post-that-was-deleted", probabilities: {}, confidence: 0.4 } }),
  ]);
  const { duplicates } = await findDuplicates([topic("x")], POSTS, { judge });
  assertEquals(duplicates[0], { probability: 0.7, of_title: null, of_slug: null });
});

Deno.test("findDuplicates() treats a missing or malformed answer as not duplicated", async () => {
  const { judge } = scriptedJudge([ok({ t1: { type: "noul" } as unknown as Answer })]);
  const { duplicates, checked } = await findDuplicates([topic("x")], POSTS, { judge });
  assertEquals(checked, true);
  assertEquals(duplicates[0], null);
});

Deno.test("findDuplicates() batches a huge archive and keeps the strongest match", async () => {
  // Enough titles to blow past the 32k state ceiling and force a second request.
  const many: Post[] = Array.from({ length: 4000 }, (_, i) => ({
    title: `A fairly long article title number ${i} about visiting somewhere`,
    slug: `post-${i}`,
  }));

  const { judge, calls } = scriptedJudge([
    ok({ t1: { type: "noul", noul: 0.12 } }),
    ok({ t1: { type: "noul", noul: 0.87 } }),
    ok({ t1: { type: "noul", noul: 0.05 } }),
    ok({ t1: { type: "choice", choice: "post-7", probabilities: {}, confidence: 0.5 } }),
  ]);

  const { duplicates, checked } = await findDuplicates([topic("x")], many, { judge });

  assertEquals(checked, true);
  assert(calls.length > 2, `expected batching, got ${calls.length} call(s)`);
  assertEquals(duplicates[0]?.probability, 0.87, "the strongest batch wins");
  assertEquals(duplicates[0]?.of_slug, "post-7");

  // Every batch must stay inside the state ceiling it was split for.
  for (const c of calls.slice(0, -1)) {
    const sent = (c.state as { existing_posts: string[] }).existing_posts;
    assert(JSON.stringify(sent).length / 4 < 32_000, "batch exceeded the state budget");
  }
});

Deno.test("findDuplicates() caps and pre-filters the attribution options", async () => {
  const many: Post[] = Array.from({ length: 200 }, (_, i) => ({ title: `Unrelated post ${i}`, slug: `p-${i}` }));
  many.push({ title: "Renting a car on Jeju island", slug: "jeju-car" });

  const { judge, calls } = scriptedJudge([
    ok({ t1: { type: "noul", noul: 0.8 } }),
    ok({ t1: { type: "choice", choice: "jeju-car", probabilities: {}, confidence: 0.9 } }),
  ]);
  await findDuplicates([topic("Renting a car on Jeju: licence rules")], many, { judge });

  const criteria = (calls[1].questions.t1 as { criteria: Record<string, string> }).criteria;
  const options = Object.keys(criteria);
  assertEquals(options.length, 40, "option list is capped");
  assert(options.includes("jeju-car"), "the relevant post survives the pre-filter");
});
