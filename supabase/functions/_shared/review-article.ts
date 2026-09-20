// Reviews a generated article before it can be published.
//
// The point is narrow and worth stating plainly: Jev does not know whether a
// fare is correct. It only judges whether a sentence ASSERTS one as settled
// fact. The output is a short list of lines for a human to verify — the
// difference between "the bus is about 1,400 won" and "the bus is 1,350 won,
// exact change only" is the difference between a hedge and a promise.
//
// Travel figures go stale, so each flagged line is also judged for whether it
// expires. Two cheaper whole-article checks ride along in the same request.

import { findClaims, type Claim, type ClaimKind } from "./claims.ts";
import {
  asNoul, asScore, judge as defaultJudge, noul, score,
  type JudgeResult, type Question,
} from "./typesafe.ts";

export interface ReviewedClaim {
  sentence: string;
  kinds: ClaimKind[];
  /** Probability the sentence states a figure as established fact. */
  asserted: number;
  /** Probability it goes out of date (festival dates, "this year", prices). */
  expires: number;
}

export interface ArticleReview {
  /** True when at least one sentence asserts a figure — publishing is then held. */
  needs_review: boolean;
  claims: ReviewedClaim[];
  /** Does the opening actually answer the title's question? */
  quick_answer_ok: boolean | null;
  /** 0-2: how well the local first-person voice holds up. */
  voice_score: number | null;
  /** How many figure-bearing sentences were examined. */
  examined: number;
  model: string;
  at: string;
}

// Tuned to catch rather than to be tidy: a missed invented fare is worse than
// an editor glancing at one extra hedged sentence.
const ASSERT_THRESHOLD = Number(Deno.env.get("ARTICLE_CLAIM_THRESHOLD") ?? "0.5");

// Keeps the state small enough for Jev to stay sharp on each sentence.
const MAX_CLAIMS = 25;

const VOICE_LEVELS = [
  "reads like generic travel copy or an encyclopedia entry",
  "mostly the right voice, but slips into neutral description",
  "consistently a Korean local speaking in first person to a traveler",
];

export interface ReviewOptions {
  threshold?: number;
  maxClaims?: number;
  judge?: (state: unknown, questions: Record<string, Question>, opts?: { timeoutMs?: number }) => Promise<JudgeResult>;
  now?: () => Date;
}

/**
 * Returns null when there is nothing to judge or the judgement fails — the
 * caller then behaves exactly as it did before this existed.
 */
export async function reviewArticle(
  title: string,
  html: string,
  opts: ReviewOptions = {},
): Promise<ArticleReview | null> {
  const judge = opts.judge ?? defaultJudge;
  const threshold = opts.threshold ?? ASSERT_THRESHOLD;
  const claims: Claim[] = findClaims(html, opts.maxClaims ?? MAX_CLAIMS);

  // The opening is what a search engine quotes, so it is checked even when the
  // article carries no figures at all.
  const opening = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 600);

  const sentences: Record<string, string> = {};
  const questions: Record<string, Question> = {
    quick_answer: noul(
      "Does the text in `opening` directly answer the question or promise in `title`, rather than introducing the topic first?",
      {
        true: "A reader gets the actual answer in the first lines",
        false: "The opening warms up, sets a scene, or defers the answer",
      },
    ),
    voice: score(
      "How well does `opening` hold the voice of a Korean local writing in the first person to a traveler?",
      VOICE_LEVELS,
    ),
  };

  claims.forEach((c, i) => {
    const id = `s${i + 1}`;
    sentences[id] = c.sentence;
    questions[`${id}_fact`] = noul(
      `Does \`sentences.${id}\` state a specific price, opening time, distance, journey time or phone number as an established fact?`,
      {
        true: "It gives an exact figure a reader would act on, stated as fact",
        false: "It has no such figure, or hedges it (about, roughly, varies, from ... upwards)",
      },
    );
    questions[`${id}_expires`] = noul(
      `Will \`sentences.${id}\` become wrong as time passes — because it names a dated event, a season, a year, or something that is routinely revised?`,
      {
        true: "It is tied to a date, a season, a year, or a figure that changes",
        false: "It is stable enough to stay true for years",
      },
    );
  });

  const res = await judge({ title, opening, sentences }, questions, { timeoutMs: 15_000 });
  if (!res.ok) {
    console.warn(`review-article: skipped (${res.error}: ${res.message})`);
    return null;
  }

  const reviewed: ReviewedClaim[] = claims
    .map((c, i) => ({
      sentence: c.sentence,
      kinds: c.kinds,
      asserted: Number((asNoul(res.answers[`s${i + 1}_fact`])?.noul ?? 0).toFixed(2)),
      expires: Number((asNoul(res.answers[`s${i + 1}_expires`])?.noul ?? 0).toFixed(2)),
    }))
    .filter((c) => c.asserted >= threshold)
    .sort((a, b) => b.asserted - a.asserted);

  const quick = asNoul(res.answers.quick_answer);
  const voice = asScore(res.answers.voice);

  return {
    needs_review: reviewed.length > 0,
    claims: reviewed,
    quick_answer_ok: quick ? quick.noul >= 0.5 : null,
    voice_score: voice ? Number(voice.score.toFixed(2)) : null,
    examined: claims.length,
    model: res.model,
    at: (opts.now?.() ?? new Date()).toISOString(),
  };
}
