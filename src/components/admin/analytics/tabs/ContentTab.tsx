import { useMemo, useState } from "react";
import { Card, Delta, Segmented } from "../ui";
import { BarList } from "../charts/BarList";
import { Scatter } from "../charts/Scatter";
import { DataTable, type Column } from "../DataTable";
import { useOpenDrill } from "../context";
import { BAD, GOOD, fmtCompact, fmtDuration, fmtNum, fmtPct, isBrokenTitle, ratio, sectionOf } from "../format";
import { hint } from "../glossary";
import { comparable, short } from "../insights";
import type { Derived, SectionTotal } from "../derive";
import type { PageRow, Report } from "../types";

type LandingRow = Report["landing"][number];

const perUser = (p: PageRow) => ratio(p.userEngagementDuration, p.activeUsers);

export function ContentTab({ r, d }: { r: Report; d: Derived }) {
  const openDrill = useOpenDrill();
  const compare = Boolean(r.compare);
  const [hideBroken, setHideBroken] = useState<"live" | "all">("live");

  const partnerClicks = useMemo(() => new Map(d.partnerPages.map((p) => [p.path, p.clicks])), [d]);
  const entrances = useMemo(() => new Map(r.landing.map((l) => [l.landingPage, l.sessions])), [r]);
  const entrancesOf = (p: PageRow) => entrances.get(p.pagePath.replace(/\/$/, "") || "/") ?? 0;

  const pages = r.pages.filter((p) => hideBroken === "all" || !isBrokenTitle(p.pageTitle));

  const points = r.pages
    .filter((p) => p.screenPageViews >= 3 && !isBrokenTitle(p.pageTitle) && p.activeUsers > 0)
    .map((p) => ({
      id: p.pagePath,
      x: p.screenPageViews,
      y: perUser(p),
      label: short(p.pageTitle || p.pagePath),
      onClick: () => openDrill({ dimension: "pagePath", value: p.pagePath, label: p.pageTitle }),
    }));

  const movers = comparable(r)
    ? r.pages.filter((p) => !isBrokenTitle(p.pageTitle)).map((p) => ({ p, gain: p.screenPageViews - p.prevViews }))
    : [];
  const rising = movers.filter((m) => m.gain > 0).sort((a, b) => b.gain - a.gain).slice(0, 8);
  const falling = movers.filter((m) => m.gain < 0).sort((a, b) => a.gain - b.gain).slice(0, 8);
  const totalViews = r.totals.current.screenPageViews;

  const sectionCols: Array<Column<SectionTotal>> = [
    { key: "label", label: "영역", value: (s) => s.label, render: (s) => <span className="font-medium text-gray-800">{s.label}</span> },
    { key: "pages", label: "페이지 수", align: "right", value: (s) => s.pages, render: (s) => fmtNum(s.pages) },
    { key: "views", label: "조회", align: "right", value: (s) => s.views, render: (s) => fmtNum(s.views) },
    ...(compare ? [{ key: "delta", label: "증감", align: "right" as const, value: (s: SectionTotal) => s.views - s.prevViews, render: (s: SectionTotal) => <Delta cur={s.views} prev={s.prevViews} size="xs" /> }] : []),
    { key: "share", label: "비중", align: "right", value: (s) => ratio(s.views, totalViews), render: (s) => fmtPct(ratio(s.views, totalViews), 0) },
    { key: "time", label: "조회당 시간", align: "right", hint: "참여 시간 ÷ 조회수", value: (s) => ratio(s.engagement, s.views), render: (s) => fmtDuration(ratio(s.engagement, s.views)) },
  ];

  const pageCols: Array<Column<PageRow>> = [
    {
      key: "title", label: "페이지", value: (p) => p.pageTitle || p.pagePath,
      render: (p) => (
        <span className="block max-w-[340px]">
          <span className="block truncate font-medium text-gray-800" title={p.pageTitle}>
            {isBrokenTitle(p.pageTitle) && <span className="mr-1 rounded bg-red-50 px-1 text-[10px] font-semibold text-[#b42323]">404</span>}
            {short(p.pageTitle || p.pagePath, 70)}
          </span>
          <span className="block truncate font-mono text-[10.5px] text-gray-400">{p.pagePath}</span>
        </span>
      ),
    },
    { key: "section", label: "영역", value: (p) => sectionOf(p.pagePath), render: (p) => <span className="whitespace-nowrap text-gray-500">{sectionOf(p.pagePath)}</span> },
    { key: "views", label: "조회", align: "right", value: (p) => p.screenPageViews, render: (p) => fmtNum(p.screenPageViews) },
    ...(compare ? [{ key: "delta", label: "증감", align: "right" as const, value: (p: PageRow) => p.screenPageViews - p.prevViews, render: (p: PageRow) => <Delta cur={p.screenPageViews} prev={p.prevViews} size="xs" /> }] : []),
    { key: "users", label: "사용자", align: "right", value: (p) => p.activeUsers, render: (p) => fmtNum(p.activeUsers) },
    { key: "entr", label: "첫 페이지로", align: "right", hint: "이 페이지에서 방문이 시작된 횟수 (검색·SNS에서 바로 들어옴)", value: entrancesOf, render: (p) => fmtNum(entrancesOf(p)) },
    { key: "time", label: "1인당 시간", align: "right", hint: hint("engagementTime"), value: perUser, render: (p) => fmtDuration(perUser(p)) },
    { key: "scroll", label: "끝까지 읽음", align: "right", hint: hint("scroll"), value: (p) => Math.min(1, ratio(p.scrolls, p.screenPageViews)), render: (p) => fmtPct(Math.min(1, ratio(p.scrolls, p.screenPageViews)), 0) },
    { key: "partner", label: "제휴 클릭", align: "right", hint: hint("partner"), value: (p) => partnerClicks.get(p.pagePath) ?? 0, render: (p) => { const n = partnerClicks.get(p.pagePath) ?? 0; return n ? <span className="font-semibold text-pink-700">{fmtNum(n)}</span> : <span className="text-gray-300">0</span>; } },
  ];

  const landingCols: Array<Column<LandingRow>> = [
    { key: "page", label: "첫 페이지 (랜딩)", hint: hint("landing"), value: (l) => l.landingPage, render: (l) => <span className="block max-w-[320px] truncate font-mono text-[11.5px] text-gray-800" title={l.landingPage}>{l.landingPage === "(not set)" ? "(기록 안 됨)" : l.landingPage}</span> },
    { key: "sessions", label: "방문", align: "right", value: (l) => l.sessions, render: (l) => fmtNum(l.sessions) },
    ...(compare ? [{ key: "delta", label: "증감", align: "right" as const, value: (l: LandingRow) => l.sessions - (l.prev?.sessions ?? 0), render: (l: LandingRow) => <Delta cur={l.sessions} prev={l.prev?.sessions ?? 0} size="xs" /> }] : []),
    { key: "eng", label: "참여율", align: "right", hint: hint("engagementRate"), value: (l) => ratio(l.engagedSessions, l.sessions), render: (l) => { const v = ratio(l.engagedSessions, l.sessions); return <span style={{ color: v >= d.engagementRate * 1.25 ? GOOD : v < d.engagementRate * 0.5 ? BAD : undefined }}>{fmtPct(v, 0)}</span>; } },
    { key: "new", label: "신규 비율", align: "right", value: (l) => ratio(l.newUsers, l.activeUsers), render: (l) => fmtPct(Math.min(1, ratio(l.newUsers, l.activeUsers)), 0) },
    { key: "time", label: "방문당 시간", align: "right", value: (l) => ratio(l.userEngagementDuration, l.sessions), render: (l) => fmtDuration(ratio(l.userEngagementDuration, l.sessions)) },
    { key: "vps", label: "방문당 페이지", align: "right", value: (l) => ratio(l.screenPageViews, l.sessions), render: (l) => ratio(l.screenPageViews, l.sessions).toFixed(2) },
    { key: "key", label: "핵심 이벤트", align: "right", value: (l) => l.keyEvents, render: (l) => fmtNum(l.keyEvents) },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <Card className="ga-rise xl:col-span-2" title="사이트 영역별" subtitle="어느 영역이 많이 읽히는지 · 오른쪽은 조회당 읽은 시간">
          <BarList
            limit={10}
            rows={d.sections.map((s) => ({
              key: s.label,
              label: s.label,
              value: s.views,
              display: `${fmtNum(s.views)}회`,
              sub: `조회당 ${fmtDuration(ratio(s.engagement, s.views))}`,
              prev: compare ? s.prevViews : undefined,
            }))}
          />
          <div className="mt-5 border-t border-gray-100 pt-4">
            <DataTable rows={d.sections} columns={sectionCols} defaultSort={{ key: "views", desc: true }} filename="sections" pageSize={10} />
          </div>
        </Card>
        <Card
          className="ga-rise xl:col-span-3"
          title="콘텐츠 기회 지도"
          help="점 하나가 페이지 하나입니다(조회 3회 이상). 오른쪽으로 갈수록 많이 봤고, 위로 갈수록 오래 읽었습니다. 선은 중간값입니다. 왼쪽 위(오래 읽는데 덜 알려진 글)는 홍보하고, 오른쪽 아래(많이 오는데 금방 떠나는 글)는 고치면 효과가 큽니다. 점을 누르면 상세가 열립니다."
          subtitle="가로: 조회수(로그 눈금) · 세로: 1인당 읽은 시간"
        >
          <Scatter
            points={points}
            xLabel="조회수"
            yLabel="1인당 읽은 시간"
            xFormat={fmtCompact}
            yFormat={fmtDuration}
            height={360}
            quadrants={{ topLeft: "숨은 보석 — 홍보하기", topRight: "인기 글 — 최신으로 유지", bottomLeft: "우선순위 낮음", bottomRight: "새는 글 — 고치기" }}
          />
        </Card>
      </div>

      {movers.length > 0 && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card className="ga-rise" title="뜨는 글" subtitle="비교 기간보다 조회가 가장 많이 는 글">
            <BarList
              empty="조회가 는 글이 없습니다."
              rows={rising.map((m) => ({
                key: m.p.pagePath,
                label: short(m.p.pageTitle || m.p.pagePath),
                text: m.p.pagePath,
                value: m.gain,
                display: `+${fmtNum(m.gain)}`,
                sub: `${fmtNum(m.p.prevViews)} → ${fmtNum(m.p.screenPageViews)}`,
                color: "#0ca30c",
                onClick: () => openDrill({ dimension: "pagePath", value: m.p.pagePath, label: m.p.pageTitle }),
              }))}
            />
          </Card>
          <Card className="ga-rise" title="지는 글" subtitle="비교 기간보다 조회가 가장 많이 준 글">
            <BarList
              empty="조회가 준 글이 없습니다."
              rows={falling.map((m) => ({
                key: m.p.pagePath,
                label: short(m.p.pageTitle || m.p.pagePath),
                text: m.p.pagePath,
                value: -m.gain,
                display: fmtNum(m.gain),
                sub: `${fmtNum(m.p.prevViews)} → ${fmtNum(m.p.screenPageViews)}`,
                color: "#d03b3b",
                onClick: () => openDrill({ dimension: "pagePath", value: m.p.pagePath, label: m.p.pageTitle }),
              }))}
            />
          </Card>
        </div>
      )}

      <Card
        className="ga-rise"
        title="전체 페이지"
        help="제목 머리를 누르면 그 기준으로 정렬됩니다. '첫 페이지로'는 그 글로 바로 들어온 횟수, '끝까지 읽음'은 90%까지 내린 비율, '제휴 클릭'은 그 글에서 예약 사이트로 나간 횟수입니다. CSV로 내려받아 엑셀에서 볼 수 있습니다."
        subtitle="관리자 페이지는 뺐습니다. 행을 누르면 그 페이지의 유입 경로·나라·외부 클릭이 열립니다."
      >
        <DataTable
          rows={pages}
          columns={pageCols}
          defaultSort={{ key: "views", desc: true }}
          search={(p) => `${p.pageTitle} ${p.pagePath}`}
          filename="pages"
          pageSize={15}
          toolbar={<Segmented size="sm" value={hideBroken} onChange={setHideBroken} options={[{ value: "live", label: "정상 페이지" }, { value: "all", label: "404 포함" }]} />}
          onRowClick={(p) => openDrill({ dimension: "pagePath", value: p.pagePath, label: p.pageTitle })}
        />
      </Card>

      <Card className="ga-rise" title="첫 페이지 (랜딩 페이지)" help={hint("landing")} subtitle="방문이 시작된 페이지 — 사람을 붙잡아야 하는 입구입니다. 참여율이 초록 = 평균보다 훨씬 높음, 빨강 = 훨씬 낮음.">
        <DataTable
          rows={r.landing}
          columns={landingCols}
          defaultSort={{ key: "sessions", desc: true }}
          search={(l) => l.landingPage}
          filename="landing-pages"
          onRowClick={(l) => l.landingPage !== "(not set)" && openDrill({ dimension: "landingPage", value: l.landingPage })}
        />
      </Card>

      <Card className="ga-rise" title="사이트 안 검색어" subtitle="방문자가 사이트에서 직접 검색한 말 — 사람들이 원하는 글감">
        <BarList
          empty={d.junkSearch ? "예전 주소의 가짜 검색어만 있고, 실제 검색은 아직 없습니다." : "이 기간에는 사이트 검색이 없습니다."}
          rows={d.realSearch.map((s) => ({
            key: s.searchTerm,
            label: `「${s.searchTerm}」`,
            value: s.eventCount,
            display: `${fmtNum(s.eventCount)}회`,
            sub: `${fmtNum(s.totalUsers)}명`,
          }))}
        />
      </Card>
    </div>
  );
}
