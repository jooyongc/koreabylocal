// Numbers the page needs that GA4 does not hand over directly: partner
// (affiliate) clicks, site sections, social traffic, broken pages.
import { isBrokenTitle, isJunkSearch, partnerOf, ratio, sectionOf } from "./format";
import type { Report } from "./types";

export interface PartnerTotal { name: string; clicks: number; prevClicks: number; users: number; domains: string[] }
export interface SectionTotal { label: string; views: number; prevViews: number; users: number; engagement: number; pages: number }

export function derive(r: Report) {
  // ── partner clicks (outbound links to affiliate programmes) ──
  const partnerMap = new Map<string, PartnerTotal>();
  for (const o of r.outbound) {
    const name = partnerOf(o.linkDomain);
    if (!name) continue;
    const p = partnerMap.get(name) ?? { name, clicks: 0, prevClicks: 0, users: 0, domains: [] };
    p.clicks += o.eventCount;
    p.prevClicks += o.prev?.eventCount ?? 0;
    p.users += o.totalUsers;
    p.domains.push(o.linkDomain);
    partnerMap.set(name, p);
  }
  const partners = [...partnerMap.values()].sort((a, b) => b.clicks - a.clicks);
  const partnerClicks = partners.reduce((n, p) => n + p.clicks, 0);
  const prevPartnerClicks = partners.reduce((n, p) => n + p.prevClicks, 0);
  const otherOutbound = r.outbound.filter((o) => !partnerOf(o.linkDomain));

  // Clicks to partners from each page, by partner.
  const byPage = new Map<string, { clicks: number; partners: Record<string, number> }>();
  for (const o of r.outboundPages) {
    const name = partnerOf(o.linkDomain);
    if (!name) continue;
    const row = byPage.get(o.pagePath) ?? { clicks: 0, partners: {} };
    row.clicks += o.eventCount;
    row.partners[name] = (row.partners[name] ?? 0) + o.eventCount;
    byPage.set(o.pagePath, row);
  }
  const pageViews = new Map(r.pages.map((p) => [p.pagePath, p]));
  const partnerPages = [...byPage.entries()]
    .map(([path, v]) => {
      const page = pageViews.get(path);
      return { path, title: page?.pageTitle ?? path, views: page?.screenPageViews ?? 0, ...v, ctr: ratio(v.clicks, page?.screenPageViews ?? 0) };
    })
    .sort((a, b) => b.clicks - a.clicks);

  // ── site sections ──
  const sectionMap = new Map<string, SectionTotal>();
  for (const p of r.pages) {
    if (isBrokenTitle(p.pageTitle)) continue;
    const label = sectionOf(p.pagePath);
    const s = sectionMap.get(label) ?? { label, views: 0, prevViews: 0, users: 0, engagement: 0, pages: 0 };
    s.views += p.screenPageViews;
    s.prevViews += p.prevViews;
    s.users += p.activeUsers; // a sum over pages: a visitor of two pages counts twice
    s.engagement += p.userEngagementDuration;
    s.pages += 1;
    sectionMap.set(label, s);
  }
  const sections = [...sectionMap.values()].sort((a, b) => b.views - a.views);

  // ── social ──
  const isInstagram = (s: string) => /instagram|^ig$/i.test(s);
  const instagram = r.sources.filter((s) => isInstagram(s.sessionSource));
  const instagramSessions = instagram.reduce((n, s) => n + s.sessions, 0);
  const instagramEngaged = instagram.reduce((n, s) => n + s.engagedSessions, 0);
  const instagramPrev = instagram.reduce((n, s) => n + (s.prev?.sessions ?? 0), 0);

  // ── health ──
  const brokenPages = r.pages.filter((p) => isBrokenTitle(p.pageTitle));
  const brokenViews = brokenPages.reduce((n, p) => n + p.screenPageViews, 0);
  const realSearch = r.search.filter((s) => s.searchTerm && s.searchTerm !== "(not set)" && !isJunkSearch(s.searchTerm));
  const junkSearch = r.search.filter((s) => isJunkSearch(s.searchTerm)).reduce((n, s) => n + s.eventCount, 0);

  const t = r.totals.current;
  return {
    partners,
    partnerClicks,
    prevPartnerClicks,
    otherOutbound,
    partnerPages,
    sections,
    instagram: { sessions: instagramSessions, engaged: instagramEngaged, prev: instagramPrev, sources: instagram },
    brokenPages,
    brokenViews,
    realSearch,
    junkSearch,
    engagementRate: ratio(t.engagedSessions, t.sessions),
    secondsPerUser: ratio(t.userEngagementDuration, t.activeUsers),
  };
}

export type Derived = ReturnType<typeof derive>;

// ── collection gaps ──────────────────────────────────────────────────────
// koreabylocal.com sent nothing to GA4 from 2026-06-21 to 2026-09-19 (the
// relaunched site shipped with a wrong measurement id). A long run of days
// with zero sessions is that kind of hole, not a quiet week, and any total or
// comparison that spans it is misleading.

export interface Gap { start: string; end: string; days: number; from: number; to: number }

/** Runs of `min`+ days with no sessions at all. */
export function findGaps(daily: Array<{ date: string; sessions: number }>, min = 5): Gap[] {
  const out: Gap[] = [];
  let from = -1;
  const close = (to: number) => {
    if (from >= 0 && to - from + 1 >= min) out.push({ start: daily[from].date, end: daily[to].date, days: to - from + 1, from, to });
    from = -1;
  };
  daily.forEach((d, i) => {
    if (d.sessions === 0) { if (from < 0) from = i; }
    else close(i - 1);
  });
  close(daily.length - 1);
  return out;
}

export interface CompareState { ok: boolean; reason: string | null }

/**
 * Whether "vs the comparison period" means anything: both periods need data
 * on most of their days, and the earlier one needs a real audience.
 */
export function compareState(r: Report): CompareState {
  if (!r.compare) return { ok: false, reason: null };
  if (!r.totals.previous || r.totals.previous.sessions === 0) {
    return { ok: false, reason: "비교 기간에는 수집된 데이터가 없습니다." };
  }
  const days = r.daily.current.length || 1;
  const curGap = findGaps(r.daily.current).reduce((n, g) => n + g.days, 0);
  const prevGap = findGaps(r.daily.previous).reduce((n, g) => n + g.days, 0);
  const prev = r.totals.previous;
  if (prevGap / days >= 0.2) {
    return { ok: false, reason: `비교 기간의 ${prevGap}일이 GA4 수집 공백이라 비교할 수 없습니다.` };
  }
  if (curGap / days >= 0.2) {
    return { ok: false, reason: `이번 기간의 ${curGap}일이 GA4 수집 공백이라 비교하면 실제보다 줄어든 것처럼 보입니다.` };
  }
  if (prev.activeUsers < 30 || prev.activeUsers < r.totals.current.activeUsers * 0.05) {
    return { ok: false, reason: `비교 기간의 사용자가 ${prev.activeUsers}명뿐이라 증감률이 의미가 없습니다.` };
  }
  return { ok: true, reason: null };
}

/** Why a gap happened, when we know. */
export function gapCause(g: Gap) {
  return g.end >= "2026-06-01" && g.end <= "2026-09-19" ? "사이트 개편 뒤 GA4 측정 ID가 잘못 들어가 있었고, 9월 20일에 바로잡았습니다" : null;
}

/** First day after the last gap — where accurate numbers start. */
export function cleanStart(gaps: Gap[]) {
  const last = gaps[gaps.length - 1];
  if (!last) return null;
  const d = new Date(`${last.end}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** The report as the tabs should see it: no comparison when one would mislead. */
export function withoutCompare(r: Report): Report {
  return { ...r, compare: null, totals: { ...r.totals, previous: null }, daily: { ...r.daily, previous: [] } };
}
