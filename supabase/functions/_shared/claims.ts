// Finds the sentences in a generated article that state a checkable figure —
// a fare, an opening time, a distance, a phone number, a date.
//
// Pure and regex-only on purpose. Jev cannot count or compare numbers, so code
// decides WHICH sentences carry a figure and Jev only judges whether each one
// asserts it as established fact. Nothing here knows if a figure is correct;
// it just narrows an article down to the handful of lines a human should check.
//
// Recall matters more than precision: a sentence wrongly flagged costs a few
// tokens, a fabricated fare that slips through costs a reader their morning.

export type ClaimKind = "money" | "time" | "duration" | "distance" | "phone" | "date" | "quantity";

export interface Claim {
  sentence: string;
  kinds: ClaimKind[];
}

const PATTERNS: Array<{ kind: ClaimKind; re: RegExp }> = [
  // ₩1,350 · KRW 5000 · $12 · 1,350 won · 3000원
  // A trailing \b would fail after "원": \w is ASCII-only, so there is no
  // word boundary between a Korean character and the space after it.
  { kind: "money", re: /(?:₩|\bKRW\b|\bUSD\b|\$)\s?\d|\b\d[\d,.]*\s?(?:won|dollars?|euros?|bucks)\b|\d\s?원/i },
  // 09:00 · 9am · 6 p.m.
  // Longest alternative first, and a lookahead rather than \b — "p.m." ends in
  // a full stop, which has no word boundary after it.
  { kind: "time", re: /\b\d{1,2}:\d{2}\b|\b\d{1,2}\s?(?:a\.m\.|p\.m\.|am|pm)(?![a-z])/i },
  // 40 minutes · 2 hours · 3 days
  { kind: "duration", re: /\b\d[\d,.]*\s?(?:min(?:ute)?s?\b|hours?\b|hrs?\b|days?\b|weeks?\b|months?\b)/i },
  // 5 km · 300 meters · 2 miles
  { kind: "distance", re: /\b\d[\d,.]*\s?(?:km\b|kilomet(?:er|re)s?\b|met(?:er|re)s?\b|miles?\b)/i },
  // 02-1234-5678 · +82 10 1234 5678 · 1330
  { kind: "phone", re: /\b(?:\+?82[-\s]?)?0?\d{1,3}[-\s]\d{3,4}[-\s]\d{4}\b/ },
  // 2026 · March 3 · 3 March
  {
    kind: "date",
    re: /\b(?:19|20)\d{2}\b|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}\b|\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\b/i,
  },
  // 1,500 steps · 12,000 visitors — any grouped or 3+ digit figure
  { kind: "quantity", re: /\b\d{1,3}(?:,\d{3})+\b|\b\d{3,}\b/ },
];

// Splitting after these would cut a sentence in half.
const ABBREVIATIONS = /(?:e\.g|i\.e|etc|vs|Mr|Mrs|Ms|Dr|St|approx|No)\.$/i;

const ENTITIES: Array<[RegExp, string]> = [
  [/&nbsp;/gi, " "],
  [/&amp;/gi, "&"],
  [/&lt;/gi, "<"],
  [/&gt;/gi, ">"],
  [/&quot;/gi, '"'],
  [/&#0?39;|&apos;/gi, "'"],
  [/&mdash;/gi, "—"],
  [/&hellip;/gi, "…"],
];

/** Strips tags, keeping block boundaries so two paragraphs never merge into one sentence. */
export function htmlToText(html: string): string {
  let text = String(html ?? "")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|td|th|tr|blockquote|section|article|figcaption)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  for (const [re, to] of ENTITIES) text = text.replace(re, to);
  return text;
}

/** Splits article text into sentences, one line at a time so lists stay separate. */
export function toSentences(html: string): string[] {
  return htmlToText(html)
    .split(/\n+/)
    .flatMap((line) => {
      const parts: string[] = [];
      let buffer = "";
      // A boundary is terminal punctuation, whitespace, then something that can
      // open a sentence — which also leaves decimals like "1.5 hours" alone.
      for (const chunk of line.split(/(?<=[.!?])\s+(?=["'“(]?[A-Z0-9가-힣])/)) {
        buffer = buffer ? `${buffer} ${chunk}` : chunk;
        if (ABBREVIATIONS.test(buffer.trim())) continue;
        parts.push(buffer);
        buffer = "";
      }
      if (buffer) parts.push(buffer);
      return parts;
    })
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length > 0);
}

/** Which kinds of figure a sentence carries, empty when it carries none. */
export function claimKinds(sentence: string): ClaimKind[] {
  return PATTERNS.filter((p) => p.re.test(sentence)).map((p) => p.kind);
}

/**
 * The sentences worth a second look, longest-first so the most substantial
 * claims survive `limit` when an article is packed with figures.
 */
export function findClaims(html: string, limit = 40): Claim[] {
  const seen = new Set<string>();
  const claims: Claim[] = [];

  for (const sentence of toSentences(html)) {
    // A bare heading like "Prices in 2026" carries no assertion to check.
    if (sentence.length < 25) continue;
    if (seen.has(sentence)) continue;
    const kinds = claimKinds(sentence);
    if (kinds.length === 0) continue;
    seen.add(sentence);
    claims.push({ sentence, kinds });
  }

  if (claims.length <= limit) return claims;
  return [...claims].sort((a, b) => b.sentence.length - a.sentence.length).slice(0, limit);
}
