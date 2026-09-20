// Picks what to put at the bottom of an article: other guides, spots to visit,
// things to buy.
//
// Computed once when an article is published or edited and stored on the row,
// so a reader never waits on a judgement. The question asked of each candidate
// is deliberately about the reader, not about similarity: "is this useful to
// someone who just read this article". A post about paying for buses should
// lead to a T-money guide, not to every other transport article.
//
// Nothing is shown below the threshold. An empty recommendation block is a
// better outcome than a padded one — a visitor who clicks a bad suggestion
// trusts the next one less.

import {
  asScore, judge as defaultJudge, score,
  type JudgeResult, type Question,
} from "./typesafe.ts";

export type RelatedKind = "posts" | "spots" | "products";

export interface Candidate {
  kind: RelatedKind;
  slug: string;
  title: string;
  summary?: string | null;
}

export interface RelatedItem {
  slug: string;
  title: string;
  score: number;
}

export interface RelatedBundle {
  posts: RelatedItem[];
  spots: RelatedItem[];
  products: RelatedItem[];
  model: string;
  at: string;
}

const USEFULNESS_LEVELS = [
  "no use to this reader",
  "same broad subject, but not what they need next",
  "the natural next thing for this reader to open",
];

/**
 * A bar per kind, because the same scale does not mean the same thing across
 * them. Measured over ten live articles: apt article-to-article pairings landed
 * 1.4-1.9 (Day Trips by Train -> How to Book KTX, 1.86) while padding sat near
 * 1.2, but spots and products almost never cleared 1.4 — booking a tour or
 * buying a workbook is a bigger ask than opening another article, so the model
 * rates them lower for the same degree of fit. One shared bar would have hidden
 * every spot and product on the site, which is the opposite of the point.
 *
 * The apt commercial pairings sat at 1.2-1.5 (a Korean-phrases article ->
 * Korean workbook 1.54, a Busan concert article -> Busan walking tour 1.36),
 * and everything below 1.2 was padding, so that is where the bar goes.
 */
const MIN_SCORE: Record<RelatedKind, number> = {
  posts: Number(Deno.env.get("RELATED_MIN_POSTS") ?? "1.4"),
  spots: Number(Deno.env.get("RELATED_MIN_SPOTS") ?? "1.2"),
  products: Number(Deno.env.get("RELATED_MIN_PRODUCTS") ?? "1.2"),
};
const PER_KIND = 3;

export interface BuildRelatedOptions {
  /** Overrides the per-kind bars; a single number applies to all three. */
  minScore?: number | Partial<Record<RelatedKind, number>>;
  perKind?: number;
  judge?: (state: unknown, questions: Record<string, Question>, opts?: { timeoutMs?: number }) => Promise<JudgeResult>;
  now?: () => Date;
}

/** Returns null when there is nothing to rank or the judgement fails. */
export async function buildRelated(
  article: { title: string; excerpt?: string | null },
  candidates: Candidate[],
  opts: BuildRelatedOptions = {},
): Promise<RelatedBundle | null> {
  const judge = opts.judge ?? defaultJudge;
  const bar: Record<RelatedKind, number> =
    typeof opts.minScore === "number"
      ? { posts: opts.minScore, spots: opts.minScore, products: opts.minScore }
      : { ...MIN_SCORE, ...(opts.minScore ?? {}) };
  const perKind = opts.perKind ?? PER_KIND;
  if (candidates.length === 0) return null;

  const items: Record<string, { title: string; about: string }> = {};
  const questions: Record<string, Question> = {};
  candidates.forEach((c, i) => {
    const id = `c${i + 1}`;
    items[id] = { title: c.title, about: (c.summary ?? "").slice(0, 200) };
    questions[id] = score(
      `A traveler has just finished reading the article in \`article\`. How useful is the item in \`items.${id}\` to them right now?`,
      USEFULNESS_LEVELS,
    );
  });

  const res = await judge(
    { article: { title: article.title, summary: (article.excerpt ?? "").slice(0, 400) }, items },
    questions,
    { timeoutMs: 20_000 },
  );
  if (!res.ok) {
    console.warn(`related: skipped (${res.error}: ${res.message})`);
    return null;
  }

  const byKind: Record<RelatedKind, RelatedItem[]> = { posts: [], spots: [], products: [] };
  candidates.forEach((c, i) => {
    const s = asScore(res.answers[`c${i + 1}`])?.score;
    if (typeof s === "number" && s >= bar[c.kind]) {
      byKind[c.kind].push({ slug: c.slug, title: c.title, score: Number(s.toFixed(2)) });
    }
  });

  for (const kind of Object.keys(byKind) as RelatedKind[]) {
    byKind[kind] = byKind[kind].sort((a, b) => b.score - a.score).slice(0, perKind);
  }

  return {
    ...byKind,
    model: res.model,
    at: (opts.now?.() ?? new Date()).toISOString(),
  };
}
