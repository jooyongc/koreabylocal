// "한눈에 보기": the period in a few plain Korean sentences, numbers in bold.
import type { CompareState, Derived, Gap } from "./derive";
import { change, channelKo, countryKo, fmtDay, fmtDuration, fmtNum, fmtPct, fmtRange, isBrokenTitle, ratio } from "./format";
import { short } from "./insights";
import type { Report } from "./types";

export type Part = string | { b: string };

export function buildSummary(r: Report, d: Derived, gaps: Gap[], cmp: CompareState): Part[][] {
  const t = r.totals.current;
  const out: Part[][] = [];

  out.push([
    `${fmtRange(r.range.startDate, r.range.endDate)} 동안 `,
    { b: `${fmtNum(t.activeUsers)}명` }, "이 ", { b: `${fmtNum(t.sessions)}번` }, " 방문해 페이지를 ",
    { b: `${fmtNum(t.screenPageViews)}번` }, " 봤습니다.",
  ]);

  out.push([
    "그중 ", { b: fmtPct(d.engagementRate, 0) }, "가 실제로 글을 읽은 방문(참여 세션)이었고, 한 사람당 평균 ",
    { b: fmtDuration(d.secondsPerUser) }, " 머물렀습니다.",
  ]);

  if (cmp.ok && r.totals.previous) {
    const c = change(t.activeUsers, r.totals.previous.activeUsers);
    if (c.kind === "change") {
      out.push(["이전 기간보다 사용자가 ", { b: `${Math.abs(Math.round(c.ratio * 100))}% ${c.ratio > 0 ? "늘었" : "줄었"}` }, "습니다."]);
    }
  } else if (cmp.reason) {
    out.push([`증감은 표시하지 않습니다 — ${cmp.reason}`]);
  }

  const channels = [...r.channels].sort((a, b) => b.sessions - a.sessions);
  const engaged = r.channels.filter((c) => c.sessions >= 20).sort((a, b) => ratio(b.engagedSessions, b.sessions) - ratio(a.engagedSessions, a.sessions));
  if (channels[0] && t.sessions > 0) {
    const line: Part[] = [
      { b: channelKo(channels[0].sessionDefaultChannelGroup) }, ` 경로로 가장 많이 들어왔고 (방문의 ${fmtPct(ratio(channels[0].sessions, t.sessions), 0)})`,
    ];
    if (engaged[0] && engaged[0].sessionDefaultChannelGroup !== channels[0].sessionDefaultChannelGroup) {
      line.push(", 가장 열심히 읽는 사람들은 ", { b: channelKo(engaged[0].sessionDefaultChannelGroup) }, ` 경로로 왔습니다 (참여율 ${fmtPct(ratio(engaged[0].engagedSessions, engaged[0].sessions), 0)}).`);
    } else {
      line.push(".");
    }
    out.push(line);
  }

  const top = r.pages.find((p) => !isBrokenTitle(p.pageTitle) && p.pagePath !== "/");
  if (top) out.push(["홈 다음으로 많이 본 글은 「", { b: short(top.pageTitle) }, `」입니다 (${fmtNum(top.screenPageViews)}회).`]);

  if (d.partnerClicks > 0) {
    out.push([
      "예약·제휴 사이트로 ", { b: `${fmtNum(d.partnerClicks)}번` }, " 넘어갔고, ",
      { b: `${d.partners[0].name} ${fmtNum(d.partners[0].clicks)}회` }, "로 가장 많습니다.",
    ]);
  } else {
    out.push(["아직 예약·제휴 사이트로 넘어간 클릭이 없습니다."]);
  }

  const market = [...r.countries].filter((c) => c.country !== "(not set)").sort((a, b) => b.engagedSessions - a.engagedSessions)[0];
  if (market && market.engagedSessions > 0) {
    out.push([{ b: countryKo(market.countryId, market.country) }, `에서 가장 열심히 읽습니다 (참여 세션 ${fmtNum(market.engagedSessions)}회).`]);
  }

  const suspects = r.quality.suspects;
  if (r.quality.excluded && suspects.length) {
    out.push([
      "봇으로 보이는 ", { b: suspects.map((s) => countryKo(s.countryId ?? "", s.country)).join("·") },
      ` 방문 ${fmtNum(suspects.reduce((n, s) => n + s.sessions, 0))}회는 위 숫자에서 뺐습니다.`,
    ]);
  }

  for (const g of gaps) {
    out.push([
      "⚠ ", { b: `${fmtDay(g.start)} ~ ${fmtDay(g.end)} (${g.days}일)` },
      "은 GA4에 데이터가 들어오지 않은 기간이라 0으로 보입니다. 그래서 위 합계는 실제보다 작습니다.",
    ]);
  }
  return out;
}
