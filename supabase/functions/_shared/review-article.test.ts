// deno test --allow-env supabase/functions/_shared/review-article.test.ts
import { assert, assertEquals } from "jsr:@std/assert@1";
import { reviewArticle } from "./review-article.ts";
import type { Answer, JudgeResult, Question } from "./typesafe.ts";

const ARTICLE = `
  <p>Annyeong (hello)! Riding a Seoul bus is the fastest way to feel local.</p>
  <p>A single ride costs 1,350 won when you tap a T-money card at the door.</p>
  <p>The first bus leaves Gangnam Station at 04:30 every morning of the week.</p>
  <p>As a local, I always sit by the back window and watch the city wake up.</p>`;

const ok = (answers: Record<string, Answer>): JudgeResult => ({
  ok: true, answers, usage: { input_tokens: 500, output_tokens: 40 }, model: "jev-1.13.0", ms: 400,
});

function scriptedJudge(result: JudgeResult) {
  const calls: Array<{ state: unknown; questions: Record<string, Question> }> = [];
  const judge = (state: unknown, questions: Record<string, Question>) => {
    calls.push({ state, questions });
    return Promise.resolve(result);
  };
  return { judge, calls };
}

const noulA = (n: number): Answer => ({ type: "noul", noul: n });
const at = () => new Date("2026-09-20T00:00:00.000Z");

Deno.test("reviewArticle() flags asserted figures and holds the rest back", async () => {
  const { judge } = scriptedJudge(ok({
    quick_answer: noulA(0.9),
    voice: { type: "score", score: 1.8, legend: {}, probabilities: {}, confidence: 0.8 },
    s1_fact: noulA(0.95), s1_expires: noulA(0.7),
    s2_fact: noulA(0.12), s2_expires: noulA(0.1),
  }));

  const review = await reviewArticle("How much is a Seoul bus?", ARTICLE, { judge, now: at });

  assert(review);
  assertEquals(review.needs_review, true);
  assertEquals(review.claims.length, 1, "only the asserted sentence is surfaced");
  assertEquals(review.claims[0].asserted, 0.95);
  assertEquals(review.claims[0].expires, 0.7);
  assert(review.claims[0].kinds.includes("money"));
  assertEquals(review.quick_answer_ok, true);
  assertEquals(review.voice_score, 1.8);
  assertEquals(review.examined, 2, "two figure-bearing sentences were examined");
  assertEquals(review.model, "jev-1.13.0");
  assertEquals(review.at, "2026-09-20T00:00:00.000Z");
});

Deno.test("reviewArticle() clears an article whose figures are all hedged", async () => {
  const { judge } = scriptedJudge(ok({
    quick_answer: noulA(0.8),
    s1_fact: noulA(0.1), s1_expires: noulA(0.1),
    s2_fact: noulA(0.2), s2_expires: noulA(0.1),
  }));
  const review = await reviewArticle("t", ARTICLE, { judge });
  assertEquals(review?.needs_review, false);
  assertEquals(review?.claims, []);
});

Deno.test("reviewArticle() sorts the riskiest claim first", async () => {
  const { judge } = scriptedJudge(ok({
    s1_fact: noulA(0.6), s1_expires: noulA(0),
    s2_fact: noulA(0.99), s2_expires: noulA(0),
  }));
  const review = await reviewArticle("t", ARTICLE, { judge });
  assertEquals(review?.claims.map((c) => c.asserted), [0.99, 0.6]);
});

Deno.test("reviewArticle() still checks the opening when there are no figures", async () => {
  const prose = "<p>Annyeong! Come wander Euljiro with me and find your own favourite alley tonight.</p>";
  const { judge, calls } = scriptedJudge(ok({
    quick_answer: noulA(0.2),
    voice: { type: "score", score: 2, legend: {}, probabilities: {}, confidence: 0.9 },
  }));

  const review = await reviewArticle("Where to drink in Euljiro", prose, { judge });

  assertEquals(Object.keys(calls[0].questions).sort(), ["quick_answer", "voice"]);
  assertEquals(review?.needs_review, false);
  assertEquals(review?.quick_answer_ok, false, "a scene-setting opening should not pass");
  assertEquals(review?.examined, 0);
});

Deno.test("reviewArticle() sends the title, opening and each sentence", async () => {
  const { judge, calls } = scriptedJudge(ok({ s1_fact: noulA(0), s2_fact: noulA(0) }));
  await reviewArticle("How much is a Seoul bus?", ARTICLE, { judge });

  const state = calls[0].state as { title: string; opening: string; sentences: Record<string, string> };
  assertEquals(state.title, "How much is a Seoul bus?");
  assert(state.opening.includes("Annyeong"));
  assert(!state.opening.includes("<p>"), "tags must be stripped before judging");
  assertEquals(Object.keys(state.sentences).length, 2);
  assert(state.sentences.s1.includes("1,350 won"));
});

Deno.test("reviewArticle() honours a custom threshold", async () => {
  const answers = { s1_fact: noulA(0.35), s2_fact: noulA(0.1) };
  assertEquals((await reviewArticle("t", ARTICLE, { judge: scriptedJudge(ok(answers)).judge }))?.claims.length, 0);
  assertEquals(
    (await reviewArticle("t", ARTICLE, { judge: scriptedJudge(ok(answers)).judge, threshold: 0.3 }))?.claims.length,
    1,
  );
});

Deno.test("reviewArticle() returns null when the judgement fails", async () => {
  const { judge } = scriptedJudge({ ok: false, error: "not_configured", message: "no key" });
  assertEquals(await reviewArticle("t", ARTICLE, { judge }), null);
});

Deno.test("reviewArticle() treats a missing answer as not asserted", async () => {
  const { judge } = scriptedJudge(ok({}));
  const review = await reviewArticle("t", ARTICLE, { judge });
  assertEquals(review?.needs_review, false, "an absent answer must not hold up a publish on its own");
  assertEquals(review?.quick_answer_ok, null);
  assertEquals(review?.voice_score, null);
});

Deno.test("reviewArticle() caps how many sentences it sends", async () => {
  const many = Array.from({ length: 60 }, (_, i) =>
    `<p>The number ${i} ride from this station costs ${1000 + i} won with a card.</p>`).join("");
  const { judge, calls } = scriptedJudge(ok({}));
  await reviewArticle("t", many, { judge, maxClaims: 5 });

  const state = calls[0].state as { sentences: Record<string, string> };
  assertEquals(Object.keys(state.sentences).length, 5);
  // Two questions per sentence, plus the two whole-article checks.
  assertEquals(Object.keys(calls[0].questions).length, 12);
});
