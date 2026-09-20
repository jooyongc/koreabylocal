// Flags generated topic ideas that an existing post already covers.
//
// Two passes, because Jev's questions cannot see each other's answers: first
// "is this a duplicate at all", then, only for what that flagged, "which post".
// Both are advisory — every failure path leaves the ideas unannotated rather
// than failing the caller.

import {
  asChoice, asNoul, choice, chunkByTokens, estimateTokens, judge as defaultJudge, noul,
  TOKEN_LIMIT_STATE, topByWordOverlap, type JudgeResult, type Question,
} from "./typesafe.ts";

export interface Post {
  title: string;
  slug: string;
}

export interface DuplicateVerdict {
  probability: number;
  of_title: string | null;
  of_slug: string | null;
}

export interface Topic {
  title: string;
  keywords: string[];
  intent: string;
  category: string;
  rationale: string;
  duplicate?: DuplicateVerdict | null;
}

// Tuned 2026-09-20 on 30 hand-labelled candidates against all 52 live titles:
// duplicates scored 0.56-0.96 and genuinely new topics 0.07-0.24, with nothing
// between. 0.40 sits in that empty band — far enough from 0.24 not to cry wolf,
// far enough below 0.56 to survive the run-to-run drift we measured (the lowest
// duplicate moved between 0.52 and 0.56 across three runs).
const DUPLICATE_THRESHOLD = Number(Deno.env.get("TYPESAFE_DUPLICATE_THRESHOLD") ?? "0.4");

// Naming which post a candidate collides with needs the archive as options.
// Pre-filtering by word overlap keeps that list short: a long option list both
// costs tokens and blunts the judgement.
const MAX_CHOICE_OPTIONS = 40;

/**
 * Flags generated topics that an existing post already covers. Advisory only —
 * any failure returns checked:false and the ideas go out unannotated rather
 * than the whole request failing.
 */
export interface FindDuplicatesOptions {
  /** Defaults to TYPESAFE_DUPLICATE_THRESHOLD, then to 0.4. */
  threshold?: number;
  /** Injected by tests. */
  judge?: (state: unknown, questions: Record<string, Question>) => Promise<JudgeResult>;
}

export async function findDuplicates(
  topics: Topic[],
  posts: Post[],
  opts: FindDuplicatesOptions = {},
): Promise<{ duplicates: (DuplicateVerdict | null)[]; checked: boolean }> {
  const judge = opts.judge ?? defaultJudge;
  const threshold = opts.threshold ?? DUPLICATE_THRESHOLD;
  const skip = { duplicates: [] as (DuplicateVerdict | null)[], checked: false };
  if (topics.length === 0 || posts.length === 0) return skip;

  const candidates: Record<string, string> = {};
  const questions: Record<string, ReturnType<typeof noul>> = {};
  topics.forEach((t, i) => {
    const id = `t${i + 1}`;
    candidates[id] = t.title;
    questions[id] = noul(
      `Would an article titled \`candidates.${id}\` substantially duplicate the topic of any article in \`existing_posts\`?`,
      {
        true: "An existing post already covers the same topic and reader intent",
        false: "No existing post covers this topic, or it only shares a broad theme",
      },
    );
  });

  // One request today (52 titles is about 800 tokens). Should the archive ever
  // outgrow the state ceiling, judge it in batches and keep each candidate's
  // strongest match, so a duplicate in any batch still counts.
  // Keep a tenth of the ceiling as headroom: estimateTokens is a 4-chars-per-token
  // approximation, and a title costs more inside a JSON array than on its own
  // (quotes and a comma), so budgeting on the bare strings overshoots.
  const budget = Math.max(
    1_000,
    Math.floor((TOKEN_LIMIT_STATE - estimateTokens(candidates) - estimateTokens(questions)) * 0.9),
  );
  const batches = chunkByTokens(posts, budget, (p) => estimateTokens(JSON.stringify(p.title)) + 1);

  const highest = new Map<string, number>();
  for (const batch of batches) {
    const res = await judge({ existing_posts: batch.map((p) => p.title), candidates }, questions);
    if (!res.ok) {
      // Partial maxima would under-report, so one bad batch drops the whole pass.
      console.warn(`suggest-topics: duplicate check skipped (${res.error}: ${res.message})`);
      return skip;
    }
    for (const id of Object.keys(questions)) {
      const p = asNoul(res.answers[id])?.noul;
      if (typeof p === "number") highest.set(id, Math.max(highest.get(id) ?? 0, p));
    }
  }

  const verdicts: (DuplicateVerdict | null)[] = topics.map((_, i) => {
    const p = highest.get(`t${i + 1}`);
    return typeof p === "number" && p >= threshold
      ? { probability: Number(p.toFixed(2)), of_title: null, of_slug: null }
      : null;
  });

  // Second pass, only for what was flagged: name the post it collides with.
  // Jev cannot see its own first answers, so this has to be a separate request.
  const flagged = verdicts.flatMap((v, i) => (v ? [{ verdict: v, i }] : []));
  if (flagged.length > 0) {
    const picks: Record<string, ReturnType<typeof choice>> = {};
    const optionsById = new Map<string, Post[]>();
    for (const { i } of flagged) {
      const id = `t${i + 1}`;
      const options = topByWordOverlap(topics[i].title, posts, MAX_CHOICE_OPTIONS, (p) => p.title);
      optionsById.set(id, options);
      const criteria: Record<string, string | null> = {};
      for (const o of options) criteria[o.slug] = o.title;
      picks[id] = choice(
        `Which of these existing articles does \`candidates.${id}\` duplicate most closely? Each option is a URL slug; its description is the article's title.`,
        criteria,
      );
    }

    const res = await judge({ candidates }, picks);
    if (res.ok) {
      for (const { verdict, i } of flagged) {
        const id = `t${i + 1}`;
        const picked = asChoice(res.answers[id]);
        const post = optionsById.get(id)?.find((p) => p.slug === picked?.choice);
        if (post) {
          verdict.of_title = post.title;
          verdict.of_slug = post.slug;
        }
      }
    } else {
      // The probability still stands; the reader just does not get a link.
      console.warn(`suggest-topics: duplicate attribution skipped (${res.error}: ${res.message})`);
    }
  }

  return { duplicates: verdicts, checked: true };
}

