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
