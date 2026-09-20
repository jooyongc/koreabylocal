// Triages a paid Ask a Local inquiry: what it is about, whether it needs an
// answer fast, and which published guides already answer it.
//
// Three rules this module exists to keep:
//   1. Only the message body is sent. Never the asker's name or email — the
//      judgement does not need them and TypeSafe's zero-retention terms are an
//      enterprise-plan feature we are not on.
//   2. It runs inside a payment webhook, so it gets one request, a 5s budget
//      and no retries. Anything slower is worth less than the delay it costs.
//   3. The verdict is advisory. It labels an email and an admin screen; it
//      never sends a reply or moves money. That matters because the text being
//      judged was written by a stranger, and a stranger's text can carry
//      instructions aimed at the model.

import {
  asChoice, asNoul, asScore, choice, judge as defaultJudge, noul, score,
  topByWordOverlap, type JudgeResult, type Question,
} from "./typesafe.ts";

export interface RelatedPost {
  slug: string;
  title: string;
  score: number;
}

export interface AiTriage {
  category: string | null;
  category_confidence: number | null;
  urgent: boolean;
  related: RelatedPost[];
  /** Resolved model version, so a stored verdict stays interpretable. */
  model: string;
  at: string;
}

export interface TriagePost {
  slug: string;
  title: string;
  excerpt: string | null;
}

// The categories the Ask a Local form offers, plus the two the form cannot
// express. Descriptions are what the model actually reads — the keys are only
// labels we store.
const CATEGORIES: Record<string, string | null> = {
  Transport: "getting around: flights, airport transfers, buses, trains, subway, taxis",
  Itinerary: "planning a trip: where to go, how long to stay, how to order the days",
  Food: "what or where to eat and drink",
  Shopping: "what to buy and where to buy it",
  Culture: "customs, etiquette, language, history, festivals, entertainment",
  Spam: "advertising, link selling, or anything that is not a genuine travel question",
  Other: null,
};

// How well a guide answers the question, lowest level first.
const RELEVANCE_LEVELS = [
  "unrelated to the question",
  "same general area, but does not answer the question",
  "answers the question directly",
];

/** Only guides scoring at least this are worth putting in front of anyone. */
const RELATED_MIN_SCORE = 1.5;
const MAX_RELATED = 3;

// Kept small on purpose: a long, mixed state blunts the judgement, and the
// word-overlap pre-filter is free.
const MAX_CANDIDATES = 30;

const WEBHOOK_TIMEOUT_MS = 5_000;

export interface TriageOptions {
  timeoutMs?: number;
  judge?: (
    state: unknown,
    questions: Record<string, Question>,
    opts?: { timeoutMs?: number; retries?: number },
  ) => Promise<JudgeResult>;
  now?: () => Date;
}

/**
 * Returns null whenever the judgement cannot be trusted or made — the caller
 * then carries on with an unlabelled inquiry, which is the pre-TypeSafe
 * behaviour.
 */
export async function triageInquiry(
  message: string,
  posts: TriagePost[],
  opts: TriageOptions = {},
): Promise<AiTriage | null> {
  const judge = opts.judge ?? defaultJudge;
  const text = (message ?? "").trim();
  if (!text) return null;

  const candidates = topByWordOverlap(text, posts, MAX_CANDIDATES, (p) => `${p.title} ${p.excerpt ?? ""}`);

  const state: Record<string, unknown> = { question: text };
  const questions: Record<string, Question> = {
    category: choice(
      "Which category best describes the traveler's question in `question`?",
      CATEGORIES,
    ),
    urgent: noul(
      "Does `question` need an answer within 48 hours because the traveler's trip is imminent or already underway?",
      {
        true: "The traveler is already in Korea, or arrives within about two days, or names a date that is nearly here",
        false: "The trip is weeks or months away, the question is general, or no timing is implied",
      },
    ),
  };

  if (candidates.length > 0) {
    const byId: Record<string, { title: string; summary: string }> = {};
    candidates.forEach((p, i) => {
      const id = `c${i + 1}`;
      byId[id] = { title: p.title, summary: (p.excerpt ?? "").slice(0, 300) };
      questions[id] = score(
        `How well does the article described in \`candidates.${id}\` answer the traveler's question in \`question\`?`,
        RELEVANCE_LEVELS,
      );
    });
    state.candidates = byId;
  }

  // One request, everything at once: the questions are judged in parallel and
  // the webhook cannot afford a second round trip.
  const res = await judge(state, questions, { timeoutMs: opts.timeoutMs ?? WEBHOOK_TIMEOUT_MS, retries: 0 });
  if (!res.ok) {
    console.warn(`triage-inquiry: skipped (${res.error}: ${res.message})`);
    return null;
  }

  const categoryAnswer = asChoice(res.answers.category);
  const urgentAnswer = asNoul(res.answers.urgent);

  const related: RelatedPost[] = candidates
    .map((p, i) => ({ post: p, answer: asScore(res.answers[`c${i + 1}`]) }))
    .filter((r) => (r.answer?.score ?? 0) >= RELATED_MIN_SCORE)
    .sort((a, b) => (b.answer?.score ?? 0) - (a.answer?.score ?? 0))
    .slice(0, MAX_RELATED)
    .map((r) => ({
      slug: r.post.slug,
      title: r.post.title,
      score: Number((r.answer?.score ?? 0).toFixed(2)),
    }));

  return {
    category: categoryAnswer?.choice ?? null,
    category_confidence: categoryAnswer ? Number(categoryAnswer.confidence.toFixed(2)) : null,
    // A missing answer must not read as urgent; unlabelled beats a false alarm.
    urgent: (urgentAnswer?.noul ?? 0) >= 0.5,
    related,
    model: res.model,
    at: (opts.now?.() ?? new Date()).toISOString(),
  };
}
