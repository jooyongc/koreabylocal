// Puts affiliate links into an article, but only where one belongs.
//
// The rules here are the ones from the Korea Buy List runbook, and they are
// compliance requirements rather than style choices:
//
//   1. The disclosure sits at the very top, ABOVE the first affiliate link.
//      Bottom-of-page placement does not meet the FTC standard.
//   2. "Affiliate link" alone is not enough — it has to say we earn a
//      commission and that the reader's price is unchanged.
//   3. Every affiliate link carries rel="nofollow sponsored".
//   4. Links stay few. An article that is mostly links is an AdSense problem.
//
// Which programs fit is judged per article rather than pasted into everything:
// a Klook tour block under a piece about Korean etiquette is the padding that
// makes readers stop trusting the recommendations.

import { asNoul, judge as defaultJudge, noul, type JudgeResult, type Question } from "./typesafe.ts";

export interface Program {
  id: string;
  /** Named in the disclosure box, so the reader knows whose links these are. */
  label: string;
  /** The subject this program belongs to, as the judgement question phrases it. */
  fits: string;
  href: string;
  cta: string;
  /** Shown under the CTA, e.g. a discount code a reader can use directly. */
  note?: string;
}

/**
 * A program is live only when its identifier is configured, so one can be
 * turned off without a deploy.
 *
 * Agoda (cid=1973475) is deliberately blank by default: that site approval was
 * granted for koreabuylist.blogspot.com, and reusing the id on another domain
 * risks the partner account. Set AFFILIATE_AGODA_CID once koreabylocal.com is
 * registered and approved in partners.agoda.com.
 */
export function activePrograms(): Program[] {
  const klook = Deno.env.get("AFFILIATE_KLOOK_AID") ?? "15500";
  const agoda = Deno.env.get("AFFILIATE_AGODA_CID") ?? "";
  const oyUrl = Deno.env.get("AFFILIATE_OLIVEYOUNG_URL") ?? "https://global.oliveyoung.com/if/rd?su=CZNYMYMX";
  const oyCode = Deno.env.get("AFFILIATE_OLIVEYOUNG_CODE") ?? "KBL0707";

  const all: Program[] = [];

  if (klook) {
    all.push({
      id: "klook",
      label: "Klook",
      fits: "booking tours, activities, day trips, transport passes, SIM cards or attraction tickets",
      href: `https://www.klook.com/en-US/coureg/40-south-korea-things-to-do/?aid=${klook}`,
      cta: "Book Korea tours, passes and tickets on Klook",
    });
  }

  if (agoda) {
    all.push({
      id: "agoda",
      label: "Agoda",
      fits: "where to stay — hotels, guesthouses, or which neighbourhood to sleep in",
      href: `https://www.agoda.com/partners/partnersearch.aspx?pcs=1&cid=${agoda}`,
      cta: "Find places to stay in Korea on Agoda",
    });
  }

  if (oyUrl && oyCode) {
    all.push({
      id: "oliveyoung",
      label: "Olive Young",
      fits: "Korean beauty, skincare or cosmetics shopping",
      href: oyUrl,
      cta: "Shop K-beauty at Olive Young Global",
      note: `Use code <strong>${oyCode}</strong> at checkout for 5% off.`,
    });
  }

  return all;
}

const DISCLOSURE_MARKER = "kbl-affiliate-disclosure";
const CTA_MARKER = "kbl-affiliate-cta";

/** True when this article already carries our blocks, so a re-run replaces rather than stacks. */
export function hasAffiliates(html: string): boolean {
  return html.includes(DISCLOSURE_MARKER) || html.includes(CTA_MARKER);
}

/** Removes previously inserted blocks so the article can be re-judged cleanly. */
export function stripAffiliates(html: string): string {
  return html
    .replace(new RegExp(`<div[^>]*class="[^"]*${DISCLOSURE_MARKER}[^"]*"[\\s\\S]*?</div>`, "g"), "")
    .replace(new RegExp(`<aside[^>]*class="[^"]*${CTA_MARKER}[^"]*"[\\s\\S]*?</aside>`, "g"), "")
    .trim();
}

function disclosureHtml(programs: Program[]): string {
  const names = programs.map((p) => p.label);
  const list = names.length === 1
    ? names[0]
    : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  // Styled inline rather than by class: article HTML is rendered raw and also
  // travels into feeds and previews, where a stylesheet does not follow it.
  return (
    `<div class="${DISCLOSURE_MARKER}" style="margin:0 0 24px;padding:12px 16px;` +
    `border-left:3px solid #12184a;background:#f6f7fb;border-radius:8px;` +
    `font-size:13.5px;line-height:1.6;color:#4b5563">` +
    `<em>This page links to ${list}. If you buy something through those links, ` +
    `I may earn a commission. This doesn't change the price you pay.</em>` +
    `</div>`
  );
}

function ctaHtml(program: Program): string {
  return (
    `<aside class="${CTA_MARKER}" data-program="${program.id}" ` +
    `style="margin:28px 0 0;padding:18px 20px;border:1px solid #e5e7eb;border-radius:12px;background:#fff">` +
    `<a href="${program.href}" rel="nofollow sponsored" target="_blank" ` +
    `style="display:inline-block;background:#ff2e97;color:#fff;padding:12px 24px;border-radius:9px;` +
    `text-decoration:none;font-weight:700;font-size:14.5px">${program.cta}</a>` +
    (program.note
      ? `<p style="margin:10px 0 0;font-size:13px;color:#6b7280">${program.note}</p>`
      : "") +
    `</aside>`
  );
}

export interface ApplyResult {
  html: string;
  /** Program ids actually inserted, in article order. */
  programs: string[];
}

export interface ApplyOptions {
  /**
   * Default 0.35, measured over the live archive with the wording below:
   * articles that clearly should carry a link scored 0.36-0.94, articles that
   * clearly should not topped out at 0.10. The bar sits in that gap, closer to
   * the negatives because they cluster so tightly.
   */
  threshold?: number;
  /** Cap on blocks per article — a page of links is an AdSense problem. */
  max?: number;
  programs?: Program[];
  judge?: (state: unknown, questions: Record<string, Question>) => Promise<JudgeResult>;
}

/**
 * Judges which programs suit the article and returns the rewritten HTML.
 *
 * Returns the article untouched with an empty program list when nothing fits —
 * which is the right answer for a piece about, say, Korean honorifics.
 */
export async function applyAffiliates(
  article: { title: string; html: string; excerpt?: string | null },
  opts: ApplyOptions = {},
): Promise<ApplyResult> {
  const judge = opts.judge ?? defaultJudge;
  const threshold = opts.threshold ?? Number(Deno.env.get("AFFILIATE_THRESHOLD") ?? "0.35");
  const max = opts.max ?? 2;
  const programs = opts.programs ?? activePrograms();

  const clean = stripAffiliates(article.html);
  if (programs.length === 0) return { html: clean, programs: [] };

  const questions: Record<string, Question> = {};
  for (const p of programs) {
    // Asks what the article is ABOUT, not what its reader might also enjoy.
    // The earlier wording ("would this traveler plausibly be booking...") invited
    // exactly the stretch it should prevent: a BTS song explainer scored 0.50 for
    // a beauty retailer because its readers plausibly like K-beauty. Rephrased to
    // subject matter, the same article scores 0.01 while a genuine K-beauty piece
    // goes from 0.83 to 0.97.
    questions[p.id] = noul(
      `Is ${p.fits} a main subject of the article in \`article\`?`,
      {
        true: "It is a main subject of the article",
        false: "The article is about something else, even if its readers might also be interested",
      },
    );
  }

  const res = await judge(
    { article: { title: article.title, summary: (article.excerpt ?? "").slice(0, 400) } },
    questions,
  );
  if (!res.ok) {
    console.warn(`affiliate: skipped (${res.error}: ${res.message})`);
    return { html: clean, programs: [] };
  }

  const chosen = programs
    .map((p) => ({ p, score: asNoul(res.answers[p.id])?.noul ?? 0 }))
    .filter((x) => x.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((x) => x.p);

  if (chosen.length === 0) return { html: clean, programs: [] };

  const html = `${disclosureHtml(chosen)}\n${clean}\n${chosen.map(ctaHtml).join("\n")}`;
  return { html, programs: chosen.map((p) => p.id) };
}
