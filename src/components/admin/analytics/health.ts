// Data health: what makes these numbers wrong, and how to fix it.
import type { Derived } from "./derive";
import { fmtNum, fmtPct, isJunkSearch, ratio } from "./format";
import type { Report } from "./types";

export type Severity = "critical" | "warning" | "info" | "good";

export interface HealthCheck {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  action?: string;
  rows?: Array<{ label: string; value: string; note?: string }>;
}

const SITE_HOSTS = ["koreabylocal.com", "www.koreabylocal.com"];

export function buildHealth(r: Report, d: Derived): HealthCheck[] {
  const out: HealthCheck[] = [];
  const t = r.totals.current;

  // Bots
  const suspects = r.quality.suspects;
  if (suspects.length) {
    const botSessions = suspects.reduce((n, s) => n + s.sessions, 0);
    const raw = r.quality.excluded ? t.sessions + botSessions : t.sessions;
    out.push({
      id: "bots",
      severity: r.quality.excluded ? "info" : "critical",
      title: `${fmtPct(ratio(botSessions, raw), 0)} of sessions look like bots`,
      detail: `${fmtNum(botSessions)} sessions from ${suspects.map((s) => s.country).join(", ")} with almost no engagement. ${r.quality.excluded ? "They are excluded from every report on this page." : "They are included right now and drag every rate down."}`,
      action: "In GA4 Admin → Data streams → Configure tag settings, the known-bot filter is always on; this traffic gets past it. Keep the exclusion on here, and consider a Cloudflare bot-fight rule for those regions if it keeps growing.",
      rows: suspects.map((s) => ({
        label: s.country,
        value: `${fmtNum(s.sessions)} sessions`,
        note: `${fmtPct(s.engagementRate, 1)} engaged · ${s.secondsPerUser.toFixed(1)}s per user`,
      })),
    });
  } else {
    out.push({ id: "bots", severity: "good", title: "No bot-like country traffic detected", detail: "No country has a large number of sessions with near-zero engagement in this period." });
  }

  // Broken pages
  if (d.brokenPages.length) {
    out.push({
      id: "broken",
      severity: d.brokenViews >= 50 ? "critical" : "warning",
      title: `${fmtNum(d.brokenViews)} views landed on missing pages`,
      detail: `${d.brokenPages.length} URLs showed the 404 page. Many look like addresses from the old imweb site that search engines and bookmarks still send people to.`,
      action: "Add 301 redirects in Cloudflare (Rules → Redirect rules) from these paths to the closest live page, e.g. /travel → /guidebook, old shop URLs → /shop.",
      rows: d.brokenPages.slice(0, 15).map((p) => ({ label: p.pagePath, value: `${fmtNum(p.screenPageViews)} views` })),
    });
  } else {
    out.push({ id: "broken", severity: "good", title: "No visits to missing pages", detail: "No page with a 404 title was viewed in this period." });
  }

  // Hostnames
  const strayHosts = r.hosts.filter((h) => !SITE_HOSTS.includes(h.hostName) && h.hostName !== "(not set)");
  if (strayHosts.length) {
    out.push({
      id: "hosts",
      severity: "warning",
      title: "Traffic recorded on other hostnames",
      detail: "The same GA4 stream is collecting from addresses that are not the live site.",
      action: "localhost is development traffic (add a GA4 data filter for it). koreabylocal.imweb.me is the old site: redirect it to koreabylocal.com or take the tag off it. translate.goog is Google Translate's proxy and is fine.",
      rows: strayHosts.map((h) => ({ label: h.hostName, value: `${fmtNum(h.sessions)} sessions`, note: `${fmtNum(h.engagedSessions)} engaged` })),
    });
  }

  // Internal (admin) traffic
  out.push({
    id: "internal",
    severity: "info",
    title: "Your own admin visits are counted",
    detail: "GA4 loads on /admin too, so editing posts adds users, sessions and engagement time. This page leaves /admin out of the page reports, but site totals still include it.",
    action: "Define internal traffic in GA4 (Admin → Data streams → Define internal traffic, your office IP) and activate the Internal traffic data filter — or stop loading GA4 on /admin.",
  });

  // (not set) landing pages
  const notSet = r.landing.find((l) => l.landingPage === "(not set)");
  if (notSet && ratio(notSet.sessions, t.sessions) >= 0.01) {
    out.push({
      id: "not-set",
      severity: "info",
      title: `${fmtPct(ratio(notSet.sessions, t.sessions), 1)} of sessions have no landing page`,
      detail: `${fmtNum(notSet.sessions)} sessions started without a page_view (session timed out and resumed, or a bot fired only an event).`,
    });
  }

  // UTM hygiene: campaign names that are cut-off or case variants of each other
  const names = [...new Set(r.campaigns.map((c) => c.sessionCampaignName))];
  const clashes: Array<{ a: string; b: string }> = [];
  for (const a of names) for (const b of names) {
    if (a !== b && a.length < b.length && b.toLowerCase().startsWith(a.toLowerCase())) clashes.push({ a, b });
    else if (a < b && a.toLowerCase() === b.toLowerCase()) clashes.push({ a, b });
  }
  if (clashes.length) {
    out.push({
      id: "utm",
      severity: "warning",
      title: "Campaign names are split across spellings",
      detail: `GA4 counts these as different campaigns: ${clashes.map((c) => `"${c.a}" / "${c.b}"`).join(", ")}. A link somewhere carries a cut-off or differently-cased utm_campaign.`,
      action: "Use one exact name per campaign (lower case). Check the Instagram profile link and any link-in-bio tools for the short version.",
      rows: r.campaigns
        .filter((c) => clashes.some((x) => x.a === c.sessionCampaignName || x.b === c.sessionCampaignName))
        .map((c) => ({ label: c.sessionCampaignName, value: `${fmtNum(c.sessions)} sessions`, note: `${c.sessionSource} / ${c.sessionMedium}` })),
    });
  }

  // Site search tracking
  const searchTotal = r.search.reduce((n, s) => n + s.eventCount, 0);
  if (d.junkSearch > 0) {
    out.push({
      id: "search-junk",
      severity: "info",
      title: `${fmtPct(ratio(d.junkSearch, searchTotal), 0)} of "site searches" are not searches`,
      detail: "view_search_results is firing on old imweb URLs that carry encoded state (\"YToxOntz…\") in the query string. Real terms are listed in Content → Site search.",
      rows: r.search.filter((s) => isJunkSearch(s.searchTerm)).slice(0, 3).map((s) => ({ label: `${s.searchTerm.slice(0, 28)}…`, value: `${fmtNum(s.eventCount)} events` })),
    });
  }

  // Key events
  if (t.keyEvents === 0) {
    out.push({
      id: "key-events",
      severity: "warning",
      title: "No key events are set up",
      detail: "Without key events GA4 cannot tell which channels and pages lead to results — every \"key events\" column stays at zero.",
      action: "GA4 Admin → Events: mark affiliate_click and form_submit as key events. Partner clicks are tracked here from outbound clicks meanwhile.",
    });
  }

  // Demographics
  if (r.age.length === 0 && r.gender.length === 0) {
    out.push({
      id: "demographics",
      severity: "info",
      title: "Age and gender are not available",
      detail: "These need Google signals. With signals on, GA4 may hide small numbers (thresholding).",
      action: "GA4 Admin → Data collection → Google signals, if you want age and gender.",
    });
  }

  // Report failures
  if (r.errors.length) {
    out.push({
      id: "errors",
      severity: "warning",
      title: `${r.errors.length} report${r.errors.length > 1 ? "s" : ""} failed to load`,
      detail: r.errors.map((e) => `${e.report}: ${e.message}`).join(" · "),
    });
  }

  // Quota
  if (r.quota) {
    const used = r.quota.hourConsumed ?? 0;
    const left = r.quota.hourRemaining ?? 0;
    out.push({
      id: "quota",
      severity: left < 5000 ? "warning" : "good",
      title: `GA4 API quota: ${fmtNum(left)} tokens left this hour`,
      detail: `This load used about ${fmtNum(used)} tokens; ${fmtNum(r.quota.dayRemaining ?? 0)} remain today. Reports are cached for five minutes.`,
    });
  }

  const order: Record<Severity, number> = { critical: 0, warning: 1, info: 2, good: 3 };
  return out.sort((a, b) => order[a.severity] - order[b.severity]);
}
