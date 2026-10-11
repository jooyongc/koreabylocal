import { STAY_OTAS, type StayImport, type StayInsert, type StayOffer } from "@/types/stays";
import { isOtaEnabled, isStayOta, offerUrlProblem } from "@/lib/stayOffers";

/**
 * Validates one pasted stay.json (or an array of them) before it is upserted.
 * Pure function — no network — so the admin sees every problem at once.
 *
 * The rules are the ones the Reels routine follows (docs/03_RULES.md):
 *  - label is what the Reel tells viewers to tap, so it must be present and short
 *  - affiliate_url must be https and must belong to the OTA named in `ota`
 *    (photos from Expedia's Creator Toolbox may only point to Expedia Group)
 *  - highlights are exactly the short strengths shown on the card (1–3, our words)
 *  - offers: one https link per OTA, on that OTA's host; the photo OTA goes
 *    first; Agoda is left out (with a warning) until it is switched on
 *
 * Keys that are missing or empty are left out of the row, so re-pasting a
 * stay.json never blanks a thumbnail, Reel link or offers saved earlier.
 */

export interface ImportResult {
  rows: StayInsert[];
  errors: string[];
  warnings: string[];
}

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function checkOffers(
  s: Partial<StayImport>,
  at: string,
  errors: string[],
  warnings: string[],
  agodaEnabled: boolean,
): StayOffer[] | undefined {
  if (s.offers === undefined || s.offers === null) return undefined;
  if (!Array.isArray(s.offers)) {
    errors.push(`${at}: offers must be a list of { "ota", "url" }`);
    return undefined;
  }
  const seen = new Set<string>();
  const offers: StayOffer[] = [];
  for (const [i, o] of (s.offers as unknown[]).entries()) {
    const where = `${at}: offers[${i}]`;
    if (!o || typeof o !== "object") {
      errors.push(`${where} must be { "ota", "url" }`);
      continue;
    }
    const { ota, url } = o as Record<string, unknown>;
    if (!isStayOta(ota)) {
      errors.push(`${where}: ota must be one of ${STAY_OTAS.join(", ")}`);
      continue;
    }
    if (seen.has(ota)) {
      errors.push(`${at}: ${ota} appears twice in offers`);
      continue;
    }
    seen.add(ota);
    const problem = offerUrlProblem(url, ota);
    if (problem) errors.push(`${where} (${ota}): ${problem}`);
    else if (ota === s.ota && url !== s.affiliate_url) errors.push(`${at}: the ${ota} link in offers differs from affiliate_url`);
    else if (!isOtaEnabled(ota, agodaEnabled)) warnings.push(`${at}: Agoda link left out — Agoda stays off until koreabylocal.com is approved`);
    else offers.push({ ota, url: url as string });
  }

  // The photo/rating OTA is the main button: make sure it is listed, first.
  if (isStayOta(s.ota) && s.affiliate_url) {
    const i = offers.findIndex((x) => x.ota === s.ota);
    if (i === -1) offers.unshift({ ota: s.ota, url: s.affiliate_url });
    else if (i > 0) offers.unshift(...offers.splice(i, 1));
  }
  return offers;
}

function check(item: unknown, at: string, errors: string[], warnings: string[], agodaEnabled: boolean): StayInsert | null {
  if (!item || typeof item !== "object") {
    errors.push(`${at}: not an object`);
    return null;
  }
  const s = item as Partial<StayImport>;
  const before = errors.length;
  const need = (k: keyof StayImport) => {
    const v = s[k];
    if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) errors.push(`${at}: "${k}" is required`);
  };
  (["slug", "label", "name", "city", "ota", "affiliate_url", "facts_checked_on"] as const).forEach(need);

  if (s.slug && !SLUG_RE.test(s.slug)) errors.push(`${at}: slug "${s.slug}" must be lowercase-with-dashes`);
  if (s.label && s.label.length > 40) errors.push(`${at}: label is ${s.label.length} chars (keep it ≤ 40, it is the name viewers look for)`);
  if (s.ota && !isStayOta(s.ota)) errors.push(`${at}: ota must be one of ${STAY_OTAS.join(", ")}`);
  if (s.facts_checked_on && !DATE_RE.test(s.facts_checked_on)) errors.push(`${at}: facts_checked_on must be YYYY-MM-DD`);

  if (s.affiliate_url && isStayOta(s.ota)) {
    const problem = offerUrlProblem(s.affiliate_url, s.ota);
    if (problem) errors.push(`${at}: affiliate_url ${problem.replace(/^url /, "")}`);
  }
  if (s.rating != null && (typeof s.rating !== "number" || s.rating < 0 || s.rating > 10)) errors.push(`${at}: rating must be 0–10`);
  if (s.review_count != null && (!Number.isInteger(s.review_count) || s.review_count < 0)) errors.push(`${at}: review_count must be a whole number`);

  const hl = Array.isArray(s.highlights) ? s.highlights.map((h) => String(h).trim()).filter(Boolean) : [];
  if (hl.length < 1 || hl.length > 3) errors.push(`${at}: highlights needs 1–3 items (got ${hl.length})`);
  if (hl.some((h) => /["“”]/.test(h))) errors.push(`${at}: highlights must be our own words, not quotes`);

  if (s.reel_url && !/^https:\/\/www\.instagram\.com\/(reel|p)\/[\w-]+\/?$/.test(s.reel_url)) errors.push(`${at}: reel_url should look like https://www.instagram.com/reel/<code>/`);

  const offers = checkOffers(s, at, errors, warnings, agodaEnabled);

  if (errors.length > before) return null;
  return {
    slug: s.slug!,
    label: s.label!.trim(),
    name: s.name!.trim(),
    city: s.city!.trim(),
    area: s.area?.trim() || null,
    ota: s.ota!,
    affiliate_url: s.affiliate_url!,
    rating: s.rating ?? null,
    review_count: s.review_count ?? null,
    facts_checked_on: s.facts_checked_on!,
    highlights: hl,
    ...(offers ? { offers: offers as unknown as StayInsert["offers"] } : {}),
    ...(s.thumb_url ? { thumb_url: s.thumb_url } : {}),
    ...(s.reel_url ? { reel_url: s.reel_url } : {}),
    is_active: s.is_active ?? true,
    sort_order: s.sort_order ?? 0,
  };
}

export function parseStayImport(text: string, opts: { agodaEnabled?: boolean } = {}): ImportResult {
  const agodaEnabled = opts.agodaEnabled ?? isOtaEnabled("Agoda");
  const errors: string[] = [];
  const warnings: string[] = [];
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return { rows: [], errors: [`Not valid JSON: ${e instanceof Error ? e.message : String(e)}`], warnings };
  }
  const list = Array.isArray(data) ? data : [data];
  const rows = list
    .map((item, i) => check(item, list.length > 1 ? `#${i + 1}` : "stay", errors, warnings, agodaEnabled))
    .filter((r): r is StayInsert => !!r);
  const slugs = rows.map((r) => r.slug);
  const dup = slugs.find((s, i) => slugs.indexOf(s) !== i);
  if (dup) errors.push(`slug "${dup}" appears twice`);
  return { rows: errors.length ? [] : rows, errors, warnings };
}
