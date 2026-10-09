import { STAY_OTAS, type StayImport, type StayInsert } from "@/types/stays";

/**
 * Validates one pasted stay.json (or an array of them) before it is upserted.
 * Pure function — no network — so the admin sees every problem at once.
 *
 * The rules are the ones the Reels routine follows (docs/03_RULES.md):
 *  - label is what the Reel tells viewers to tap, so it must be present and short
 *  - affiliate_url must be https and must belong to the OTA named in `ota`
 *    (photos from Expedia's Creator Toolbox may only point to Expedia Group)
 *  - highlights are exactly the short strengths shown on the card (1–3, our words)
 */

export interface ImportResult {
  rows: StayInsert[];
  errors: string[];
}

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Hosts each OTA's affiliate links may use. Expedia Travel Creator links are
// expedia.com/affiliates/...; Booking.com via CJ goes through CJ's click hosts.
const OTA_HOSTS: Record<string, RegExp> = {
  Expedia: /(^|\.)expedia\.[a-z.]+$/i,
  "Hotels.com": /(^|\.)hotels\.com$/i,
  "Booking.com": /(^|\.)(booking\.com|anrdoezrs\.net|jdoqocy\.com|tkqlhce\.com|dpbolvw\.net|kqzyfj\.com)$/i,
  "Trip.com": /(^|\.)trip\.com$/i,
  Agoda: /(^|\.)agoda\.com$/i,
};

function check(item: unknown, at: string, errors: string[]): StayInsert | null {
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
  if (s.ota && !(STAY_OTAS as readonly string[]).includes(s.ota)) errors.push(`${at}: ota must be one of ${STAY_OTAS.join(", ")}`);
  if (s.facts_checked_on && !DATE_RE.test(s.facts_checked_on)) errors.push(`${at}: facts_checked_on must be YYYY-MM-DD`);

  if (s.affiliate_url) {
    try {
      const u = new URL(s.affiliate_url);
      if (u.protocol !== "https:") errors.push(`${at}: affiliate_url must be https`);
      const hostRe = s.ota ? OTA_HOSTS[s.ota] : undefined;
      if (hostRe && !hostRe.test(u.hostname)) errors.push(`${at}: affiliate_url host ${u.hostname} does not belong to ${s.ota}`);
    } catch {
      errors.push(`${at}: affiliate_url is not a valid URL`);
    }
  }
  if (s.rating != null && (typeof s.rating !== "number" || s.rating < 0 || s.rating > 10)) errors.push(`${at}: rating must be 0–10`);
  if (s.review_count != null && (!Number.isInteger(s.review_count) || s.review_count < 0)) errors.push(`${at}: review_count must be a whole number`);

  const hl = Array.isArray(s.highlights) ? s.highlights.map((h) => String(h).trim()).filter(Boolean) : [];
  if (hl.length < 1 || hl.length > 3) errors.push(`${at}: highlights needs 1–3 items (got ${hl.length})`);
  if (hl.some((h) => /["“”]/.test(h))) errors.push(`${at}: highlights must be our own words, not quotes`);

  if (s.reel_url && !/^https:\/\/www\.instagram\.com\/(reel|p)\/[\w-]+\/?$/.test(s.reel_url)) errors.push(`${at}: reel_url should look like https://www.instagram.com/reel/<code>/`);

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
    thumb_url: s.thumb_url || null,
    reel_url: s.reel_url || null,
    is_active: s.is_active ?? true,
    sort_order: s.sort_order ?? 0,
  };
}

export function parseStayImport(text: string): ImportResult {
  const errors: string[] = [];
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return { rows: [], errors: [`Not valid JSON: ${e instanceof Error ? e.message : String(e)}`] };
  }
  const list = Array.isArray(data) ? data : [data];
  const rows = list.map((item, i) => check(item, list.length > 1 ? `#${i + 1}` : "stay", errors)).filter((r): r is StayInsert => !!r);
  const slugs = rows.map((r) => r.slug);
  const dup = slugs.find((s, i) => slugs.indexOf(s) !== i);
  if (dup) errors.push(`slug "${dup}" appears twice`);
  return { rows: errors.length ? [] : rows, errors };
}
