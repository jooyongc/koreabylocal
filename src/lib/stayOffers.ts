import { STAY_OTAS, type StayOffer, type StayOta, type StayRow } from "@/types/stays";

/**
 * Booking links on a /where-to-stay card.
 *
 * `ota` / `affiliate_url` is the OTA the Reel's photos and rating came from
 * (Expedia Group); it is always the card's main button. `offers` adds the
 * other OTAs we hold an affiliate link for, so visitors can book on the site
 * they already use. See where-to-stay-kit/PROMPT_02_MULTI_OTA.md.
 */

// Hosts each OTA's affiliate links may use. Expedia Travel Creator links are
// expedia.com/affiliates/...; Trip.com's dashboard makes www.trip.com/t/...
// short links; Booking.com via CJ goes through CJ's click hosts.
export const OTA_HOSTS: Record<StayOta, RegExp> = {
  Expedia: /(^|\.)expedia\.[a-z.]+$/i,
  "Hotels.com": /(^|\.)hotels\.com$/i,
  "Booking.com": /(^|\.)(booking\.com|anrdoezrs\.net|jdoqocy\.com|tkqlhce\.com|dpbolvw\.net|kqzyfj\.com)$/i,
  "Trip.com": /(^|\.)trip\.com$/i,
  Agoda: /(^|\.)agoda\.com$/i,
};

export function isStayOta(v: unknown): v is StayOta {
  return typeof v === "string" && (STAY_OTAS as readonly string[]).includes(v);
}

/** Why `url` can't be used as a link for `ota`, or null when it can. */
export function offerUrlProblem(url: unknown, ota: StayOta): string | null {
  if (typeof url !== "string" || !url.trim()) return "url is required";
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return "url must be https";
    if (!OTA_HOSTS[ota].test(u.hostname)) return `url host ${u.hostname} does not belong to ${ota}`;
    // The blog's Agoda CID must never be used on this domain.
    if (ota === "Agoda" && u.searchParams.get("cid") !== AGODA_SITE_CID) return `Agoda url must use cid=${AGODA_SITE_CID}`;
    return null;
  } catch {
    return "url is not a valid URL";
  }
}

/**
 * Agoda stays off until koreabylocal.com is approved as an Agoda site — the
 * CID we have is approved for the blog only, and using it here risks the
 * partner account. Set VITE_AFFILIATE_AGODA_ENABLED=true once approved.
 */
/** The Agoda site id approved for koreabylocal.com/where-to-stay (2026-10-11). */
export const AGODA_SITE_CID = "1977183";

export function isOtaEnabled(ota: StayOta, agodaEnabled = import.meta.env?.VITE_AFFILIATE_AGODA_ENABLED === "true"): boolean {
  return ota !== "Agoda" || agodaEnabled;
}

/** Every stored link, the photo/rating OTA first, each OTA once. */
export function stayOffers(stay: Pick<StayRow, "ota" | "affiliate_url" | "offers">): StayOffer[] {
  const list: StayOffer[] = isStayOta(stay.ota) ? [{ ota: stay.ota, url: stay.affiliate_url }] : [];
  for (const o of Array.isArray(stay.offers) ? stay.offers : []) {
    if (!o || typeof o !== "object" || Array.isArray(o)) continue;
    const { ota, url } = o as Record<string, unknown>;
    if (!isStayOta(ota) || typeof url !== "string" || !url.startsWith("https://")) continue;
    if (list.some((x) => x.ota === ota)) continue;
    list.push({ ota, url });
  }
  return list;
}

/** The links a visitor sees: stored links minus OTAs that are switched off. */
export function visibleOffers(stay: Pick<StayRow, "ota" | "affiliate_url" | "offers">): StayOffer[] {
  return stayOffers(stay).filter((o) => isOtaEnabled(o.ota));
}

// The OTA a visitor last clicked, so their usual site is the first chip next
// visit. A per-browser convenience only — storage may be unavailable.
const PREF_KEY = "kbl_pref_ota";

export function readPreferredOta(): StayOta | null {
  try {
    const v = localStorage.getItem(PREF_KEY);
    return isStayOta(v) ? v : null;
  } catch {
    return null;
  }
}

export function rememberPreferredOta(ota: StayOta) {
  try {
    localStorage.setItem(PREF_KEY, ota);
  } catch {
    // private mode or blocked storage: nothing to remember
  }
}
