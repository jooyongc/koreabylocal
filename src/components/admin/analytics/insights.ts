// Rule-based reading of the report: what changed, what works, what to do next.
// Every rule has a minimum sample so a handful of visits never becomes a
// headline, and every number in a sentence comes straight from the report.
// Sentences avoid putting a Korean particle right after a variable name, so
// they read correctly whatever the name ends in.
import { cleanStart, gapCause, type Derived, type Gap } from "./derive";
import {
  WEEKDAYS, change, channelKo, countryKo, deviceKo, fmtChange, fmtDay, fmtDuration, fmtNum, fmtPct, isBrokenTitle, ratio,
} from "./format";
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

/** `r` is the report as shown — its comparison is already dropped when it would mislead. */
export function buildInsights(r: Report, d: Derived, gaps: Gap[]): Insight[] {
  const out: Insight[] = [];
  const t = r.totals.current;
  const siteRate = d.engagementRate;
  const canCompare = comparable(r);

  // 0. Collection gap
  const gapDays = gaps.reduce((n, g) => n + g.days, 0);
  if (gapDays > 0) {
    const g = gaps[0];
    out.push({
      id: "gap", tone: "warning", weight: 100,
      figure: `${gapDays}일`,
      title: `${fmtDay(g.start)} ~ ${fmtDay(g.end)} 데이터가 비어 있습니다`,
      body: `이 기간에는 사이트가 GA4로 데이터를 보내지 못했습니다${gapCause(g) ? ` (${gapCause(g)})` : ""}. 그래서 이 기간이 들어간 합계와 비교는 실제보다 작게 나옵니다. 정확하게 보려면 ${fmtDay(cleanStart(gaps)!)} 이후만 보세요(위 안내의 버튼).`,
      tab: "health",
    });
  }

  // 1. Traffic change and the channel behind it
  if (canCompare && r.totals.previous) {
    const prev = r.totals.previous;
    const c = change(t.activeUsers, prev.activeUsers);
    if (c.kind === "change" && Math.abs(c.ratio) >= 0.1) {
      const movers = r.channels
        .map((ch) => ({ name: ch.sessionDefaultChannelGroup, delta: ch.sessions - (ch.prev?.sessions ?? 0) }))
        .sort((a, b) => (c.ratio > 0 ? b.delta - a.delta : a.delta - b.delta));
      const lead = movers[0];
      out.push({
        id: "traffic-change", tone: c.ratio > 0 ? "win" : "warning", weight: 90,
        figure: fmtChange(c),
        title: `사용자 ${Math.abs(Math.round(c.ratio * 100))}% ${c.ratio > 0 ? "증가" : "감소"} (이전 기간 대비)`,
        body: lead && lead.delta !== 0
          ? `가장 크게 움직인 경로: ${channelKo(lead.name)} (방문 ${lead.delta > 0 ? "+" : ""}${fmtNum(lead.delta)}회).`
          : "특정 경로 하나로 설명되는 변화는 아닙니다.",
        drill: lead ? { dimension: "sessionDefaultChannelGroup", value: lead.name } : undefined,
      });
    }
  }

  // 2. Which channel brings readers, and which only brings visits
  const channels = r.channels.filter((c) => c.sessions >= 20);
  if (channels.length >= 2 && t.sessions >= 50) {
    const rated = channels.map((c) => ({ ...c, rate: ratio(c.engagedSessions, c.sessions) })).sort((a, b) => b.rate - a.rate);
    const best = rated[0], worst = rated[rated.length - 1];
    if (best.rate > siteRate * 1.25 && best.rate - worst.rate > 0.15) {
      out.push({
        id: "best-channel", tone: "opportunity", weight: 80,
        figure: fmtPct(best.rate, 0),
        title: `${channelKo(best.sessionDefaultChannelGroup)} 방문자가 가장 열심히 읽습니다`,
        body: `참여율 ${fmtPct(best.rate, 0)} — 사이트 평균 ${fmtPct(siteRate, 0)}, ${channelKo(worst.sessionDefaultChannelGroup)} 경로는 ${fmtPct(worst.rate, 0)}. 진짜 독자가 오는 길에 콘텐츠·홍보 노력을 더 쓰세요.`,
        drill: { dimension: "sessionDefaultChannelGroup", value: best.sessionDefaultChannelGroup },
        tab: "acquisition",
      });
    }
  }

  // 3. The page that brings the most engaged visitors
  const landings = r.landing.filter((l) => l.landingPage !== "(not set)" && !isBrokenLanding(l.landingPage, r));
  const topLanding = [...landings].sort((a, b) => b.engagedSessions - a.engagedSessions)[0];
  if (topLanding && topLanding.engagedSessions >= 10) {
    out.push({
      id: "top-landing", tone: "win", weight: 70,
      figure: fmtNum(topLanding.engagedSessions),
      title: `제대로 읽는 방문을 가장 많이 데려오는 입구: ${titleOf(r, topLanding.landingPage)}`,
      body: `이 페이지에서 시작한 방문 ${fmtNum(topLanding.sessions)}회 중 ${fmtPct(ratio(topLanding.engagedSessions, topLanding.sessions), 0)}가 참여했습니다. 여기서 관련 가이드, 숙소(Where to Stay), Ask a Local로 이어지는 링크를 눈에 띄게 두세요.`,
      drill: { dimension: "landingPage", value: topLanding.landingPage },
      tab: "content",
    });
  }

  // 4. Hidden gems: read for long, seen by few
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
        title: `숨은 보석: 「${short(gem.pageTitle)}」`,
        body: `읽는 사람은 평균 ${fmtDuration(perUser(gem))} 머무는데(보통 글은 ${fmtDuration(mEng)}), 조회는 ${fmtNum(gem.screenPageViews)}회뿐입니다. 릴스·뉴스레터·홈 화면에서 소개해 보세요.`,
        drill: { dimension: "pagePath", value: gem.pagePath },
        tab: "content",
      });
    }
  }

  // 5. Landing pages that lose people
  if (t.sessions >= 100) {
    const leaky = landings
      .filter((l) => l.sessions >= 20 && ratio(l.engagedSessions, l.sessions) < siteRate * 0.5)
      .sort((a, b) => b.sessions - a.sessions)[0];
    if (leaky) {
      out.push({
        id: "leaky-landing", tone: "warning", weight: 72,
        figure: fmtPct(1 - ratio(leaky.engagedSessions, leaky.sessions), 0),
        title: `들어오자마자 떠나는 입구: ${titleOf(r, leaky.landingPage)}`,
        body: `이 페이지로 들어온 ${fmtNum(leaky.sessions)}회 중 참여는 ${fmtPct(ratio(leaky.engagedSessions, leaky.sessions), 0)}뿐입니다(사이트 평균 ${fmtPct(siteRate, 0)}). 첫 화면이 검색어나 링크의 기대와 맞는지 보고, 다음에 볼 곳을 분명히 보여 주세요.`,
        drill: { dimension: "landingPage", value: leaky.landingPage },
        tab: "content",
      });
    }
  }

  // 6. Rising and falling pages
  if (canCompare) {
    const movers = r.pages.filter((p) => !isBrokenTitle(p.pageTitle)).map((p) => ({ p, gain: p.screenPageViews - p.prevViews }));
    const up = movers.filter((m) => m.p.prevViews >= 5 && m.gain >= 10).sort((a, b) => b.gain - a.gain)[0];
    const down = movers.filter((m) => m.p.prevViews >= 20 && m.gain <= -10).sort((a, b) => a.gain - b.gain)[0];
    if (up) {
      out.push({
        id: "rising-page", tone: "win", weight: 60, figure: `+${fmtNum(up.gain)}`,
        title: `뜨는 글: 「${short(up.p.pageTitle)}」`,
        body: `조회 ${fmtNum(up.p.prevViews)} → ${fmtNum(up.p.screenPageViews)}회. 무엇이 사람을 보내는지 열어 보고(상세 보기) 같은 방식을 더 써 보세요.`,
        drill: { dimension: "pagePath", value: up.p.pagePath },
      });
    }
    if (down) {
      out.push({
        id: "falling-page", tone: "warning", weight: 55, figure: fmtNum(down.gain),
        title: `지는 글: 「${short(down.p.pageTitle)}」`,
        body: `조회 ${fmtNum(down.p.prevViews)} → ${fmtNum(down.p.screenPageViews)}회. 검색 순위와 정보가 아직 최신인지 확인해 보세요.`,
        drill: { dimension: "pagePath", value: down.p.pagePath },
      });
    }
  }

  // 7. When readers show up (engaged sessions only, so bots don't decide it)
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
      figure: hh(bestStart),
      title: `가장 잘 읽히는 때: ${WEEKDAYS[bestDay]}요일, ${hh(bestStart)}~${hh(bestStart + 3)} (한국 시간)`,
      body: `참여 세션의 ${fmtPct(bestSum / heatTotal, 0)}가 이 3시간에 몰립니다. 릴스·게시물은 그 1시간쯤 전에 올리면 좋습니다.`,
    });
  }

  // 8. Markets
  const markets = [...r.countries].filter((c) => c.country !== "(not set)").sort((a, b) => b.engagedSessions - a.engagedSessions);
  if (markets[0] && markets[0].engagedSessions >= 10) {
    const top3 = markets.slice(0, 3).map((c) => `${countryKo(c.countryId, c.country)} ${fmtNum(c.engagedSessions)}`).join(", ");
    out.push({
      id: "markets", tone: "info", weight: 45,
      figure: markets[0].countryId,
      title: `가장 열심히 읽는 나라: ${countryKo(markets[0].countryId, markets[0].country)}`,
      body: `참여 세션 기준: ${top3}. 캡션·해시태그·게시 시간을 이 나라들에 맞춰 보세요.`,
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
        title: `늘고 있는 나라: ${countryKo(grower.countryId, grower.country)}`,
        body: `사용자 ${fmtNum(grower.prev.activeUsers)} → ${fmtNum(grower.activeUsers)}명.`,
        drill: { dimension: "country", value: grower.country },
      });
    }
  }

  // 9. Mobile vs desktop
  const mobile = r.devices.find((x) => x.deviceCategory === "mobile");
  const desktop = r.devices.find((x) => x.deviceCategory === "desktop");
  if (mobile && desktop && mobile.sessions >= 30 && desktop.sessions >= 30) {
    const mr = ratio(mobile.engagedSessions, mobile.sessions), dr = ratio(desktop.engagedSessions, desktop.sessions);
    const share = ratio(mobile.engagedSessions, mobile.engagedSessions + desktop.engagedSessions);
    if (Math.abs(mr - dr) >= 0.1) {
      out.push({
        id: "device-gap", tone: "opportunity", weight: 48,
        figure: fmtPct(share, 0),
        title: `${deviceKo(mr > dr ? "mobile" : "desktop")}에서 더 열심히 읽습니다 (참여율 ${fmtPct(Math.max(mr, dr), 0)} vs ${fmtPct(Math.min(mr, dr), 0)})`,
        body: `참여 세션의 ${fmtPct(share, 0)}가 모바일입니다. ${mr > dr ? "페이지는 휴대폰 화면을 먼저 기준으로 만들고 확인하세요." : "모바일 화면에서 떠나는 사람이 많으니 휴대폰 화면을 점검해 보세요."}`,
        drill: { dimension: "deviceCategory", value: mr > dr ? "mobile" : "desktop" },
        tab: "audience",
      });
    }
  }

  // 10. Partner (affiliate) clicks
  if (d.partnerClicks > 0) {
    const topPage = d.partnerPages[0];
    out.push({
      id: "partner-clicks", tone: "win", weight: 85,
      figure: fmtNum(d.partnerClicks),
      title: `예약·제휴 사이트로 ${fmtNum(d.partnerClicks)}번 넘어갔습니다`,
      body: `${d.partners.slice(0, 4).map((p) => `${p.name} ${fmtNum(p.clicks)}`).join(", ")}.${topPage ? ` 가장 많이 보낸 페이지: 「${short(topPage.title)}」 ${fmtNum(topPage.clicks)}회 (조회의 ${fmtPct(topPage.ctr, 0)}).` : ""}`,
      drill: topPage ? { dimension: "pagePath", value: topPage.path } : undefined,
      tab: "engagement",
    });
  } else if (t.screenPageViews >= 200) {
    out.push({
      id: "no-partner-clicks", tone: "opportunity", weight: 70,
      title: "아직 예약·제휴 사이트 클릭이 없습니다",
      body: "가이드에서 입장권·투어·숙소를 언급하는 곳에 Klook, Trip.com, 호텔 링크를 넣어 보세요. 여행을 계획 중인 독자는 클릭합니다.",
      tab: "engagement",
    });
  }

  // 11. Instagram
  if (d.instagram.sessions >= 5) {
    const rate = ratio(d.instagram.engaged, d.instagram.sessions);
    out.push({
      id: "instagram", tone: rate >= siteRate ? "win" : "info", weight: 58,
      figure: fmtNum(d.instagram.sessions),
      title: `인스타그램에서 ${fmtNum(d.instagram.sessions)}회 방문, 참여율 ${fmtPct(rate, 0)}`,
      body: `사이트 평균(${fmtPct(siteRate, 0)})보다 ${rate >= siteRate ? "높습니다. 릴스를 보고 온 사람이 실제로 읽고 있습니다" : "낮습니다. 프로필 링크가 릴스에서 약속한 페이지로 바로 가는지 확인하세요"}.`,
      drill: { dimension: "sessionDefaultChannelGroup", value: "Organic Social" },
      tab: "acquisition",
    });
  }

  // 12. What visitors search for
  if (d.realSearch.length > 0) {
    out.push({
      id: "search-demand", tone: "opportunity", weight: 42,
      figure: fmtNum(d.realSearch.reduce((n, s) => n + s.eventCount, 0)),
      title: `사이트에서 「${d.realSearch[0].searchTerm}」 검색`,
      body: d.realSearch.length > 1
        ? `검색어: ${d.realSearch.slice(0, 5).map((s) => `「${s.searchTerm}」`).join(", ")}. 사람들이 이미 찾고 있는 글감입니다.`
        : "검색어 하나하나가 사람들이 이미 찾는 글감입니다. 그 글이 있는지, 메뉴에서 쉽게 찾을 수 있는지 확인하세요.",
      tab: "content",
    });
  }

  // 13. Retention
  const cohorts = r.cohorts.filter((c) => c.size >= 30 && c.active[1] != null);
  if (cohorts.length >= 2) {
    const w1 = cohorts.reduce((n, c) => n + (c.active[1] ?? 0), 0) / cohorts.reduce((n, c) => n + c.size, 0);
    out.push({
      id: "retention", tone: w1 < 0.05 ? "warning" : "info", weight: 52,
      figure: fmtPct(w1, 1),
      title: `처음 온 다음 주에 다시 오는 비율 ${fmtPct(w1, 1)}`,
      body: w1 < 0.05
        ? "거의 모두 한 번 오고 맙니다. 다시 올 이유를 주세요: 가이드 끝 뉴스레터 신청, 인스타 팔로우 안내, 연재 글('서울 3일 코스 2편')."
        : "다시 오는 독자가 쌓이고 있습니다. 뉴스레터와 연재를 계속하세요.",
      tab: "retention",
    });
  }

  // 14. Returning vs new
  const ret = r.userType.find((u) => u.newVsReturning === "returning");
  const neu = r.userType.find((u) => u.newVsReturning === "new");
  if (ret && neu && ret.sessions >= 20 && neu.sessions >= 20) {
    const rr = ratio(ret.engagedSessions, ret.sessions), nr = ratio(neu.engagedSessions, neu.sessions);
    if (rr > nr * 1.5) {
      out.push({
        id: "returning", tone: "info", weight: 35,
        figure: `${(rr / Math.max(nr, 0.01)).toFixed(1)}배`,
        title: "다시 온 사람이 훨씬 열심히 읽습니다",
        body: `참여율: 다시 온 사람 ${fmtPct(rr, 0)}, 처음 온 사람 ${fmtPct(nr, 0)}. 한 명을 다시 오게 하는 것이 새 방문 여러 번만큼 값집니다.`,
        drill: { dimension: "newVsReturning", value: "returning" },
      });
    }
  }

  // 15. AI assistants
  const ai = r.channels.find((c) => c.sessionDefaultChannelGroup === "AI Assistant");
  if (ai && ai.sessions > 0) {
    out.push({
      id: "ai-assistants", tone: "info", weight: 30,
      figure: fmtNum(ai.sessions),
      title: `ChatGPT 같은 AI 챗봇에서 ${fmtNum(ai.sessions)}회 방문`,
      body: "AI가 사이트를 출처로 인용하기 시작했습니다. 분명한 소제목, 날짜, FAQ가 있는 글이 인용되기 쉽습니다.",
      drill: { dimension: "sessionDefaultChannelGroup", value: "AI Assistant" },
    });
  }

  return out.sort((a, b) => b.weight - a.weight);
}

function isBrokenLanding(path: string, r: Report) {
  const page = r.pages.find((p) => p.pagePath === path || p.pagePath === `${path}/`);
  return page ? isBrokenTitle(page.pageTitle) : false;
}

/** A landing path's page title in 「」 — or the path when the page is unknown. */
function titleOf(r: Report, path: string) {
  const page = r.pages.find((p) => p.pagePath === path || p.pagePath === `${path}/`);
  return page ? `「${short(page.pageTitle)}」` : path;
}

/** "Can Foreigners Visit the DMZ? How to Go (2026 Guide) | Korea By Local" → "Can Foreigners Visit the DMZ? How to Go (2026 Guide)" */
export function short(title: string, max = 60) {
  const t = title.replace(/\s*[|—–-]\s*Korea [Bb]y Local.*$/, "").trim() || title;
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}
