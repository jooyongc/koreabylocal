// Data health: what makes these numbers wrong, and how to fix it.
import { cleanStart, gapCause, type Derived, type Gap } from "./derive";
import { countryKo, fmtDay, fmtNum, fmtPct, isJunkSearch, ratio } from "./format";
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

export function buildHealth(r: Report, d: Derived, gaps: Gap[]): HealthCheck[] {
  const out: HealthCheck[] = [];
  const t = r.totals.current;

  // Collection gaps
  if (gaps.length) {
    out.push({
      id: "gaps",
      severity: "critical",
      title: `GA4 수집 공백 ${gaps.reduce((n, g) => n + g.days, 0)}일`,
      detail: `이 기간에는 하루 방문이 0으로 기록됐습니다. 실제로 아무도 안 온 게 아니라 사이트가 GA4로 데이터를 보내지 못한 것입니다.${gapCause(gaps[0]) ? ` ${gapCause(gaps[0])}.` : ""} 이 기간이 들어간 합계·평균·비교는 실제보다 작습니다.`,
      action: `지난 데이터는 되살릴 수 없습니다. ${fmtDay(cleanStart(gaps)!, true)} 이후 기간으로 판단하세요. 작년과의 비교는 공백이 끝난 지 1년이 지나야 의미가 생깁니다.`,
      rows: gaps.map((g) => ({ label: `${fmtDay(g.start, true)} ~ ${fmtDay(g.end, true)}`, value: `${g.days}일` })),
    });
  }

  // Bots
  const suspects = r.quality.suspects;
  if (suspects.length) {
    const botSessions = suspects.reduce((n, s) => n + s.sessions, 0);
    const raw = r.quality.excluded ? t.sessions + botSessions : t.sessions;
    out.push({
      id: "bots",
      severity: r.quality.excluded ? "info" : "critical",
      title: `방문의 ${fmtPct(ratio(botSessions, raw), 0)}가 봇으로 보입니다`,
      detail: `${suspects.map((s) => countryKo(s.countryId ?? "", s.country)).join(", ")}에서 ${fmtNum(botSessions)}회 들어왔지만 거의 머물지 않았습니다(1인당 몇 초). 사람이 아니라 크롤러·광고 사기용 프로그램의 전형적인 모습입니다. ${r.quality.excluded ? "지금은 이 페이지의 모든 숫자에서 빠져 있습니다." : "지금은 포함돼 있어서 모든 비율이 실제보다 나쁘게 보입니다."}`,
      action: "이 페이지에서는 '봇 의심 제외'를 켜 두세요. GA4가 알려진 봇은 이미 걸러내지만 이런 방문은 통과합니다. 계속 늘면 Cloudflare에서 해당 지역의 봇 차단 규칙(Bot Fight Mode)을 검토할 수 있습니다.",
      rows: suspects.map((s) => ({
        label: countryKo(s.countryId ?? "", s.country),
        value: `${fmtNum(s.sessions)}회`,
        note: `참여율 ${fmtPct(s.engagementRate, 1)} · 1인당 ${s.secondsPerUser.toFixed(1)}초`,
      })),
    });
  } else {
    out.push({ id: "bots", severity: "good", title: "봇으로 보이는 나라별 방문 없음", detail: "방문은 많은데 거의 머물지 않는 나라가 이 기간에는 없습니다." });
  }

  // Broken pages
  if (d.brokenPages.length) {
    out.push({
      id: "broken",
      severity: "warning",
      title: `없는 페이지(404)로 들어온 조회 ${fmtNum(d.brokenViews)}회`,
      detail: `주소 ${d.brokenPages.length}개가 '페이지를 찾을 수 없음' 화면을 보여 줬습니다. 대부분 예전 imweb 사이트의 주소입니다(검색엔진·즐겨찾기에 남아 있음).`,
      action: "2026년 10월 11일에 처리했습니다. 예전 게시판(/travel, /83, /143)은 여행 가이드로, /190은 Ask a Local로, /all·/theme는 즐길거리로, /shop_view는 전자책으로 자동 이동(301)합니다. 앞으로 새로 보이는 주소가 있으면 알려 주세요.",
      rows: d.brokenPages.slice(0, 15).map((p) => ({ label: p.pagePath, value: `${fmtNum(p.screenPageViews)}회` })),
    });
  } else {
    out.push({ id: "broken", severity: "good", title: "없는 페이지로 들어온 조회 없음", detail: "이 기간에 404 화면이 열린 적이 없습니다." });
  }

  // Hostnames
  const strayHosts = r.hosts.filter((h) => !SITE_HOSTS.includes(h.hostName) && h.hostName !== "(not set)");
  if (strayHosts.length) {
    out.push({
      id: "hosts",
      severity: "info",
      title: "다른 주소에서 들어온 데이터가 섞여 있습니다",
      detail: "같은 GA4에 실제 사이트가 아닌 주소의 기록도 들어옵니다. 이 페이지는 koreabylocal.com만 세므로 아래 숫자는 모두 빠져 있습니다.",
      action: "localhost(개발 중 화면)와 미리보기 주소는 10월 11일부터 GA4로 보내지 않습니다. koreabylocal.imweb.me는 예전 imweb 사이트에 GA4 코드가 남아 있는 것이니, imweb 관리자에서 GA 코드를 지우거나 사이트를 닫으면 됩니다. translate.goog는 구글 번역으로 본 방문이라 괜찮습니다.",
      rows: strayHosts.map((h) => ({ label: h.hostName, value: `${fmtNum(h.sessions)}회`, note: `참여 ${fmtNum(h.engagedSessions)}` })),
    });
  }

  // Internal (admin) traffic
  out.push({
    id: "internal",
    severity: "good",
    title: "관리자 방문은 이제 기록되지 않습니다",
    detail: "10월 11일부터 /admin 화면과 관리자 계정으로 로그인한 상태에서는 GA4가 아무것도 보내지 않습니다. 그 전 기간에는 관리자 본인의 방문이 섞여 있지만, 이 페이지의 페이지별 보고서에서는 /admin을 뺐습니다.",
  });

  // (not set) landing pages
  const notSet = r.landing.find((l) => l.landingPage === "(not set)");
  if (notSet && ratio(notSet.sessions, t.sessions) >= 0.01) {
    out.push({
      id: "not-set",
      severity: "info",
      title: `방문의 ${fmtPct(ratio(notSet.sessions, t.sessions), 1)}는 첫 페이지가 기록되지 않았습니다`,
      detail: `${fmtNum(notSet.sessions)}회. 페이지 조회 없이 시작된 방문입니다(30분 넘게 쉬었다가 다시 움직였거나, 봇이 이벤트만 보낸 경우). 적으면 신경 쓰지 않아도 됩니다.`,
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
      title: "같은 캠페인이 다른 이름으로 나뉘어 집계됩니다",
      detail: `GA4는 이름이 한 글자만 달라도 다른 캠페인으로 셉니다: ${clashes.map((c) => `「${c.a}」/「${c.b}」`).join(", ")}. 어딘가의 링크에 잘린 이름이 붙어 있습니다.`,
      action: "캠페인마다 정확히 한 가지 이름(소문자)만 쓰세요. 인스타그램 프로필 링크와 링크 모음 도구에 짧은 이름이 남아 있는지 확인하세요. 프로필 링크는 …utm_campaign=koreastaylist 여야 합니다.",
      rows: r.campaigns
        .filter((c) => clashes.some((x) => x.a === c.sessionCampaignName || x.b === c.sessionCampaignName))
        .map((c) => ({ label: c.sessionCampaignName, value: `${fmtNum(c.sessions)}회`, note: `${c.sessionSource} / ${c.sessionMedium}` })),
    });
  }

  // Site search tracking
  const searchTotal = r.search.reduce((n, s) => n + s.eventCount, 0);
  if (d.junkSearch > 0) {
    out.push({
      id: "search-junk",
      severity: "info",
      title: `'사이트 검색'의 ${fmtPct(ratio(d.junkSearch, searchTotal), 0)}는 실제 검색이 아닙니다`,
      detail: "예전 imweb 주소에 붙어 있던 암호 같은 값(\"YToxOntz…\")을 GA4가 검색어로 착각했습니다. 10월 11일부터 이런 주소는 값을 지우고 이동시키므로 앞으로는 줄어듭니다. 진짜 검색어는 콘텐츠 탭 → 사이트 검색에 있습니다.",
      rows: r.search.filter((s) => isJunkSearch(s.searchTerm)).slice(0, 3).map((s) => ({ label: `${s.searchTerm.slice(0, 28)}…`, value: `${fmtNum(s.eventCount)}회` })),
    });
  }

  // Key events
  if (t.keyEvents === 0) {
    out.push({
      id: "key-events",
      severity: "warning",
      title: "핵심 이벤트가 설정돼 있지 않습니다",
      detail: "핵심 이벤트가 없으면 GA4가 '어느 경로·어느 글이 성과를 냈는지' 계산하지 못해 모든 '핵심 이벤트' 칸이 0입니다. 그동안은 이 페이지가 외부 링크 클릭으로 제휴사 클릭을 따로 셉니다.",
      action: "GA4 관리 → 데이터 표시 → 이벤트에서 affiliate_click(예약 버튼)과 form_submit(문의 제출) 옆 '핵심 이벤트로 표시'를 켭니다.",
    });
  }

  // Demographics
  if (r.age.length === 0 && r.gender.length === 0) {
    out.push({
      id: "demographics",
      severity: "info",
      title: "나이·성별 정보가 없습니다",
      detail: "GA4는 'Google 신호 데이터'를 켜야 나이·성별을 보여 줍니다. 켜더라도 방문이 적으면 개인 식별을 막으려고 숫자를 감춥니다.",
      action: "필요하면 GA4 관리 → 데이터 수집 → Google 신호 데이터 수집을 켭니다. 개인정보 처리방침에 맞춤형 광고 관련 문구가 필요할 수 있어 신중히 결정하세요.",
    });
  }

  // Report failures
  if (r.errors.length) {
    out.push({
      id: "errors",
      severity: "warning",
      title: `보고서 ${r.errors.length}개를 불러오지 못했습니다`,
      detail: r.errors.map((e) => `${e.report}: ${e.message}`).join(" · "),
    });
  }

  // Quota
  if (r.quota) {
    const left = r.quota.hourRemaining ?? 0;
    out.push({
      id: "quota",
      severity: left < 5000 ? "warning" : "good",
      title: `GA4 조회 한도: 이번 시간 ${fmtNum(left)} 토큰 남음`,
      detail: `이번 조회에 약 ${fmtNum(r.quota.hourConsumed ?? 0)} 토큰을 썼고, 오늘 ${fmtNum(r.quota.dayRemaining ?? 0)} 토큰이 남았습니다. 같은 조건의 결과는 5분간 저장해 두고 다시 씁니다.`,
    });
  }

  const order: Record<Severity, number> = { critical: 0, warning: 1, info: 2, good: 3 };
  return out.sort((a, b) => order[a.severity] - order[b.severity]);
}
