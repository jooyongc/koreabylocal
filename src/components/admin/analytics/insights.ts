// Rule-based reading of the report: what changed, what works, what to do next.
// Every rule has a minimum sample so a handful of visits never becomes a
// headline, and every number in a sentence comes straight from the report.
import type { Derived } from "./derive";
import { change, fmtChange, fmtDuration, fmtNum, fmtPct, isBrokenTitle, ratio } from "./format";

const DAY_NAMES = ["Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays", "Sundays"];
import type { DrillTarget, Report } from "./types";

export type Tone = "win" | "opportunity" | "warning" | "info";
export type TabKey = "overview" | "acquisition" | "content" | "audience" | "engagement" | "retention" | "realtime" | "health";

export interface Insight {
  id: string;
  tone: Tone;
  title: string;
  body: string;
  figure?: string;
  drill?: DrillTarget;
  tab?: TabKey;
  /** Higher shows first. */
  weight: number;
}

const median = (vals: number[]) => {
  const s = [...vals].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};

/** Is there a comparison period with enough data to talk about change? */
export function comparable(r: Report) {
  const prev = r.totals.previous;
  return Boolean(prev && prev.activeUsers >= 30 && prev.activeUsers >= r.totals.current.activeUsers * 0.05);
}

export function buildInsights(r: Report, d: Derived): Insight[] {
  const out: Insight[] = [];
  const t = r.totals.current;
  const prev = r.totals.previous;
  const siteRate = d.engagementRate;
  const canCompare = comparable(r);

  // 1. Comparison sanity
  if (prev && !canCompare) {
    out.push({
      id: "thin-compare", tone: "info", weight: 40,
      title: `The comparison period has only ${fmtNum(prev.activeUsers)} users`,
      body: "Tracking was barely recording then, so changes against it are marked \"new\" instead of a percentage. Compare with a later period once a few weeks of data have built up.",
    });
  }

  // 2. Traffic change and the channel behind it
  if (canCompare && prev) {
    const c = change(t.activeUsers, prev.activeUsers);
    if (c.kind === "change" && Math.abs(c.ratio) >= 0.1) {
      const movers = r.channels
        .map((ch) => ({ name: ch.sessionDefaultChannelGroup, delta: ch.sessions - (ch.prev?.sessions ?? 0) }))
        .sort((a, b) => (c.ratio > 0 ? b.delta - a.delta : a.delta - b.delta));
      const lead = movers[0];
      out.push({
        id: "traffic-change", tone: c.ratio > 0 ? "win" : "warning", weight: 90,
        figure: fmtChange(c),
        title: `Users ${c.ratio > 0 ? "up" : "down"} ${fmtChange(c).replace(/^[+-]/, "")} vs the previous period`,
        body: lead && lead.delta !== 0
          ? `${lead.name} moved most (${lead.delta > 0 ? "+" : ""}${fmtNum(lead.delta)} sessions).`
          : "No single channel explains the change.",
        drill: lead ? { dimension: "sessionDefaultChannelGroup", value: lead.name } : undefined,
      });
    }
  }

  // 3. Which channel brings readers, and which only brings visits
  const channels = r.channels.filter((c) => c.sessions >= 20);
  if (channels.length >= 2 && t.sessions >= 50) {
    const rated = channels.map((c) => ({ ...c, rate: ratio(c.engagedSessions, c.sessions) })).sort((a, b) => b.rate - a.rate);
    const best = rated[0], worst = rated[rated.length - 1];
    if (best.rate > siteRate * 1.25 && best.rate - worst.rate > 0.15) {
      out.push({
        id: "best-channel", tone: "opportunity", weight: 80,
        figure: fmtPct(best.rate, 0),
        title: `${best.sessionDefaultChannelGroup} visitors engage ${(best.rate / Math.max(worst.rate, 0.01)).toFixed(1)}× more than ${worst.sessionDefaultChannelGroup}`,
        body: `${fmtPct(best.rate, 0)} of ${best.sessionDefaultChannelGroup} sessions are engaged, against ${fmtPct(worst.rate, 0)} for ${worst.sessionDefaultChannelGroup} and ${fmtPct(siteRate, 0)} site-wide. Put effort where readers come from.`,
        drill: { dimension: "sessionDefaultChannelGroup", value: best.sessionDefaultChannelGroup },
        tab: "acquisition",
      });
    }
  }

  // 4. The page that brings the most engaged visitors
  const landings = r.landing.filter((l) => l.landingPage !== "(not set)" && !isBrokenLanding(l.landingPage, r));
  const topLanding = [...landings].sort((a, b) => b.engagedSessions - a.engagedSessions)[0];
  if (topLanding && topLanding.engagedSessions >= 10) {
    out.push({
      id: "top-landing", tone: "win", weight: 70,
      figure: fmtNum(topLanding.engagedSessions),
      title: `${titleOf(r, topLanding.landingPage)} brings the most engaged visitors`,
      body: `${fmtNum(topLanding.engagedSessions)} engaged sessions started there (${fmtPct(ratio(topLanding.engagedSessions, topLanding.sessions), 0)} of its ${fmtNum(topLanding.sessions)}). Link related guides and a booking or Ask a Local call to action from it.`,
      drill: { dimension: "landingPage", value: topLanding.landingPage },
      tab: "content",
    });
  }

  // 5. Hidden gems: read for long, seen by few
  const pages = r.pages.filter((p) => p.screenPageViews >= 5 && !isBrokenTitle(p.pageTitle) && p.pagePath !== "/");
  if (pages.length >= 6) {
    const perUser = (p: (typeof pages)[number]) => ratio(p.userEngagementDuration, p.activeUsers);
    const mEng = median(pages.map(perUser));
    const mViews = median(pages.map((p) => p.screenPageViews));
    const gem = pages
      .filter((p) => perUser(p) >= mEng * 1.5 && perUser(p) >= 30 && p.screenPageViews <= mViews * 1.5)
      .sort((a, b) => perUser(b) - perUser(a))[0];
    if (gem) {
      out.push({
        id: "hidden-gem", tone: "opportunity", weight: 75,
        figure: fmtDuration(perUser(gem)),
        title: `Hidden gem: "${short(gem.pageTitle)}"`,
        body: `Readers spend ${fmtDuration(perUser(gem))} on it (median page: ${fmtDuration(mEng)}), but only ${fmtNum(gem.screenPageViews)} views. Feature it in a Reel, the newsletter or the home page.`,
        drill: { dimension: "pagePath", value: gem.pagePath },
        tab: "content",
      });
    }
  }

  // 6. Landing pages that lose people
  if (t.sessions >= 100) {
    const leaky = landings
      .filter((l) => l.sessions >= 20 && ratio(l.engagedSessions, l.sessions) < siteRate * 0.5)
      .sort((a, b) => b.sessions - a.sessions)[0];
    if (leaky) {
      out.push({
        id: "leaky-landing", tone: "warning", weight: 72,
        figure: fmtPct(1 - ratio(leaky.engagedSessions, leaky.sessions), 0),
        title: `Most visitors leave ${titleOf(r, leaky.landingPage)} without engaging`,
        body: `${fmtNum(leaky.sessions)} sessions landed there; only ${fmtPct(ratio(leaky.engagedSessions, leaky.sessions), 0)} engaged (site: ${fmtPct(siteRate, 0)}). Check what the first screen promises against the search or link that brings people in, and give a clear next step.`,
        drill: { dimension: "landingPage", value: leaky.landingPage },
        tab: "content",
      });
    }
  }

  // 7. Rising and falling pages
  if (canCompare) {
    const movers = r.pages
      .filter((p) => !isBrokenTitle(p.pageTitle))
      .map((p) => ({ p, gain: p.screenPageViews - p.prevViews }));
    const up = movers.filter((m) => m.p.prevViews >= 5 && m.gain >= 10).sort((a, b) => b.gain - a.gain)[0];
    const down = movers.filter((m) => m.p.prevViews >= 20 && m.gain <= -10).sort((a, b) => a.gain - b.gain)[0];
    if (up) {
      out.push({
        id: "rising-page", tone: "win", weight: 60,
        figure: `+${fmtNum(up.gain)}`,
        title: `Rising: "${short(up.p.pageTitle)}"`,
        body: `${fmtNum(up.p.screenPageViews)} views, up from ${fmtNum(up.p.prevViews)}. Find out what is sending people (open it) and do more of that.`,
        drill: { dimension: "pagePath", value: up.p.pagePath },
      });
    }
    if (down) {
      out.push({
        id: "falling-page", tone: "warning", weight: 55,
        figure: fmtNum(down.gain),
        title: `Falling: "${short(down.p.pageTitle)}"`,
        body: `${fmtNum(down.p.screenPageViews)} views, down from ${fmtNum(down.p.prevViews)}. Check its search ranking and whether the information is still current.`,
        drill: { dimension: "pagePath", value: down.p.pagePath },
      });
    }
  }

  // 8. When readers show up (engaged sessions only, so bots don't decide it)
  const heat = r.heatmap.kst.engaged;
  const heatTotal = heat.flat().reduce((a, b) => a + b, 0);
  if (heatTotal >= 30) {
    const byDay = heat.map((row) => row.reduce((a, b) => a + b, 0));
    const bestDay = byDay.indexOf(Math.max(...byDay));
    const byHour = Array.from({ length: 24 }, (_, h) => heat.reduce((n, row) => n + row[h], 0));
    let bestStart = 0, bestSum = -1;
    for (let h = 0; h < 24; h++) {
      const s = byHour[h] + byHour[(h + 1) % 24] + byHour[(h + 2) % 24];
      if (s > bestSum) { bestSum = s; bestStart = h; }
    }
    const hh = (h: number) => `${String(h % 24).padStart(2, "0")}:00`;
    out.push({
      id: "best-time", tone: "opportunity", weight: 65,
      figure: `${hh(bestStart)}`,
      title: `Readers are most engaged on ${DAY_NAMES[bestDay]} and ${hh(bestStart)}–${hh(bestStart + 3)} KST`,
      body: `${fmtPct(bestSum / heatTotal, 0)} of engaged sessions fall in that 3-hour window. Schedule Reels and posts about an hour before it.`,
      tab: "overview",
    });
  }

  // 9. Markets
  const markets = [...r.countries].filter((c) => c.country !== "(not set)").sort((a, b) => b.engagedSessions - a.engagedSessions);
  if (markets[0] && markets[0].engagedSessions >= 10) {
    const top3 = markets.slice(0, 3).map((c) => `${c.country} ${fmtNum(c.engagedSessions)}`).join(", ");
    out.push({
      id: "markets", tone: "info", weight: 45,
      figure: markets[0].countryId,
      title: `${markets[0].country} is the most engaged market`,
      body: `Engaged sessions: ${top3}. Match captions, hashtags and posting times to these markets.`,
      drill: { dimension: "country", value: markets[0].country },
      tab: "audience",
    });
  }
  if (canCompare) {
    const grower = r.countries
      .filter((c) => (c.prev?.activeUsers ?? 0) >= 10 && c.activeUsers - (c.prev?.activeUsers ?? 0) >= 15)
      .sort((a, b) => (b.activeUsers - (b.prev?.activeUsers ?? 0)) - (a.activeUsers - (a.prev?.activeUsers ?? 0)))[0];
    if (grower) {
      out.push({
        id: "growing-market", tone: "win", weight: 50,
        figure: fmtChange(change(grower.activeUsers, grower.prev.activeUsers)),
        title: `Growing market: ${grower.country}`,
        body: `${fmtNum(grower.activeUsers)} users, up from ${fmtNum(grower.prev.activeUsers)}.`,
        drill: { dimension: "country", value: grower.country },
      });
    }
  }

  // 10. Mobile vs desktop
  const mobile = r.devices.find((x) => x.deviceCategory === "mobile");
  const desktop = r.devices.find((x) => x.deviceCategory === "desktop");
  if (mobile && desktop && mobile.sessions >= 30 && desktop.sessions >= 30) {
    const mr = ratio(mobile.engagedSessions, mobile.sessions), dr = ratio(desktop.engagedSessions, desktop.sessions);
    const share = ratio(mobile.engagedSessions, mobile.engagedSessions + desktop.engagedSessions);
    if (Math.abs(mr - dr) >= 0.1) {
      const better = mr > dr ? "Mobile" : "Desktop";
      out.push({
        id: "device-gap", tone: "opportunity", weight: 48,
        figure: fmtPct(share, 0),
        title: `${better} visitors engage more (${fmtPct(Math.max(mr, dr), 0)} vs ${fmtPct(Math.min(mr, dr), 0)})`,
        body: `${fmtPct(share, 0)} of engaged sessions are on mobile. ${mr > dr ? "Design and test pages phone-first — that is where the readers are." : "Check the mobile layout: phone visitors leave more often."}`,
        drill: { dimension: "deviceCategory", value: mr > dr ? "mobile" : "desktop" },
        tab: "audience",
      });
    }
  }

  // 11. Partner (affiliate) clicks
  if (d.partnerClicks > 0) {
    const topPage = d.partnerPages[0];
    out.push({
      id: "partner-clicks", tone: "win", weight: 85,
      figure: fmtNum(d.partnerClicks),
      title: `${fmtNum(d.partnerClicks)} clicks to booking partners`,
      body: `${d.partners.slice(0, 4).map((p) => `${p.name} ${fmtNum(p.clicks)}`).join(", ")}.${topPage ? ` ${short(topPage.title)} drives the most (${fmtNum(topPage.clicks)}, ${fmtPct(topPage.ctr, 0)} of its views).` : ""}`,
      drill: topPage ? { dimension: "pagePath", value: topPage.path } : undefined,
      tab: "engagement",
    });
  } else if (t.screenPageViews >= 200) {
    out.push({
      id: "no-partner-clicks", tone: "opportunity", weight: 70,
      title: "No clicks to booking partners yet",
      body: "Add Klook, Trip.com or hotel links where guides mention a ticket, tour or stay — readers who are planning click through.",
      tab: "engagement",
    });
  }

  // 12. Instagram
  if (d.instagram.sessions >= 5) {
    const rate = ratio(d.instagram.engaged, d.instagram.sessions);
    out.push({
      id: "instagram", tone: rate >= siteRate ? "win" : "info", weight: 58,
      figure: fmtNum(d.instagram.sessions),
      title: `Instagram sent ${fmtNum(d.instagram.sessions)} sessions, ${fmtPct(rate, 0)} engaged`,
      body: `${rate >= siteRate ? "Higher" : "Lower"} engagement than the site average (${fmtPct(siteRate, 0)}). Keep the profile link pointing at the page each Reel promises.`,
      drill: { dimension: "sessionDefaultChannelGroup", value: "Organic Social" },
      tab: "acquisition",
    });
  }

  // 13. What visitors search for
  if (d.realSearch.length > 0) {
    out.push({
      id: "search-demand", tone: "opportunity", weight: 42,
      figure: fmtNum(d.realSearch.reduce((n, s) => n + s.eventCount, 0)),
      title: `Visitors searched for "${d.realSearch[0].searchTerm}"`,
      body: d.realSearch.length > 1
        ? `Top searches: ${d.realSearch.slice(0, 5).map((s) => `"${s.searchTerm}"`).join(", ")}. Each one is a guide people already want.`
        : "A search is a guide someone already wants — check one exists and is easy to find from the menu.",
      tab: "content",
    });
  }

  // 14. Retention
  const cohorts = r.cohorts.filter((c) => c.size >= 30 && c.active[1] != null);
  if (cohorts.length >= 2) {
    const w1 = cohorts.reduce((n, c) => n + (c.active[1] ?? 0), 0) / cohorts.reduce((n, c) => n + c.size, 0);
    out.push({
      id: "retention", tone: w1 < 0.05 ? "warning" : "info", weight: 52,
      figure: fmtPct(w1, 1),
      title: `${fmtPct(w1, 1)} come back the week after their first visit`,
      body: w1 < 0.05
        ? "Almost everyone visits once. Give readers a reason to return: newsletter sign-up in guides, an Instagram follow prompt, a \"plan your trip\" series."
        : "Returning readers are building up — keep the newsletter and series content going.",
      tab: "retention",
    });
  }

  // 15. Returning vs new
  const ret = r.userType.find((u) => u.newVsReturning === "returning");
  const neu = r.userType.find((u) => u.newVsReturning === "new");
  if (ret && neu && ret.sessions >= 20 && neu.sessions >= 20) {
    const rr = ratio(ret.engagedSessions, ret.sessions), nr = ratio(neu.engagedSessions, neu.sessions);
    if (rr > nr * 1.5) {
      out.push({
        id: "returning", tone: "info", weight: 35,
        figure: `${(rr / Math.max(nr, 0.01)).toFixed(1)}×`,
        title: "Returning visitors engage far more than new ones",
        body: `${fmtPct(rr, 0)} of returning sessions are engaged, against ${fmtPct(nr, 0)} for first-timers. Every reader you bring back is worth several new visits.`,
        drill: { dimension: "newVsReturning", value: "returning" },
      });
    }
  }

  // 16. AI assistants
  const ai = r.channels.find((c) => c.sessionDefaultChannelGroup === "AI Assistant");
  if (ai && ai.sessions > 0) {
    out.push({
      id: "ai-assistants", tone: "info", weight: 30,
      figure: fmtNum(ai.sessions),
      title: `AI assistants sent ${fmtNum(ai.sessions)} session${ai.sessions === 1 ? "" : "s"}`,
      body: "ChatGPT and similar tools now cite the site. Clear headings, dates and FAQ blocks make guides easier for them to quote.",
      drill: { dimension: "sessionDefaultChannelGroup", value: "AI Assistant" },
    });
  }

  return out.sort((a, b) => b.weight - a.weight);
}

function isBrokenLanding(path: string, r: Report) {
  const page = r.pages.find((p) => p.pagePath === path || p.pagePath === `${path}/`);
  return page ? isBrokenTitle(page.pageTitle) : false;
}

/** A landing path's page title, shortened — or the path when the page is unknown. */
function titleOf(r: Report, path: string) {
  const page = r.pages.find((p) => p.pagePath === path || p.pagePath === `${path}/`);
  return page ? `"${short(page.pageTitle)}"` : path;
}

/** "Can Foreigners Visit the DMZ? How to Go (2026 Guide) | Korea By Local" → "Can Foreigners Visit the DMZ? How to Go (2026 Guide)" */
export function short(title: string, max = 60) {
  const t = title.replace(/\s*[|—–-]\s*Korea [Bb]y Local.*$/, "").trim() || title;
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}
