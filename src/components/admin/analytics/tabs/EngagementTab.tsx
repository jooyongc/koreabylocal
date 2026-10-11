import { Card, Delta } from "../ui";
import { KpiTile } from "../cards";
import { BarList } from "../charts/BarList";
import { ShareBar } from "../charts/misc";
import { DataTable, type Column } from "../DataTable";
import { useOpenDrill } from "../context";
import { eventKo, fmtDuration, fmtNum, fmtPct, isBrokenTitle, partnerColor, partnerRank, ratio } from "../format";
import { hint } from "../glossary";
import { short } from "../insights";
import type { Derived } from "../derive";
import type { Report } from "../types";

type EventRow = Report["events"][number];
type PartnerPage = Derived["partnerPages"][number];

// GA4 collects these on its own; the rest are the site's (or enhanced measurement's) events.
const AUTO = new Set(["page_view", "session_start", "first_visit", "user_engagement"]);

export function EngagementTab({ r, d }: { r: Report; d: Derived }) {
  const openDrill = useOpenDrill();
  const compare = Boolean(r.compare);

  const ev = (name: string) => r.events.find((e) => e.eventName === name);
  const formStart = ev("form_start")?.eventCount ?? 0;
  const formSubmit = ev("form_submit")?.eventCount ?? 0;

  const wts = r.pages.find((p) => p.pagePath === "/where-to-stay");
  const wtsClicks = d.partnerPages.find((p) => p.path === "/where-to-stay");
  const partnerPageViews = d.partnerPages.reduce((n, p) => n + p.views, 0);

  const eventCols: Array<Column<EventRow>> = [
    {
      key: "name", label: "이벤트 (GA4 이름)", hint: hint("event"), value: (e) => e.eventName,
      render: (e) => (
        <span className="block">
          <span className="font-medium text-gray-800">{eventKo(e.eventName) ?? e.eventName}</span>
          {AUTO.has(e.eventName) && <span className="ml-1.5 rounded bg-gray-100 px-1 text-[10px] text-gray-500">자동</span>}
          {e.keyEvents > 0 && <span className="ml-1.5 rounded bg-amber-50 px-1 text-[10px] font-semibold text-amber-800">핵심</span>}
          <span className="block font-mono text-[10.5px] text-gray-400">{e.eventName}</span>
        </span>
      ),
    },
    { key: "count", label: "횟수", align: "right", value: (e) => e.eventCount, render: (e) => fmtNum(e.eventCount) },
    ...(compare ? [{ key: "delta", label: "증감", align: "right" as const, value: (e: EventRow) => e.eventCount - (e.prev?.eventCount ?? 0), render: (e: EventRow) => <Delta cur={e.eventCount} prev={e.prev?.eventCount ?? 0} size="xs" /> }] : []),
    { key: "users", label: "사람 수", align: "right", value: (e) => e.totalUsers, render: (e) => fmtNum(e.totalUsers) },
    { key: "per", label: "1인당", align: "right", value: (e) => ratio(e.eventCount, e.totalUsers), render: (e) => ratio(e.eventCount, e.totalUsers).toFixed(2) },
    { key: "reach", label: "도달 비율", align: "right", hint: "이 행동을 한 사람 ÷ 전체 사용자", value: (e) => ratio(e.totalUsers, r.totals.current.activeUsers), render: (e) => fmtPct(Math.min(1, ratio(e.totalUsers, r.totals.current.activeUsers)), 1) },
  ];

  const partnerPageCols: Array<Column<PartnerPage>> = [
    { key: "page", label: "페이지", value: (p) => p.title, render: (p) => <span className="block max-w-[320px] truncate font-medium text-gray-800" title={p.path}>{short(p.title)}</span> },
    { key: "views", label: "조회", align: "right", value: (p) => p.views, render: (p) => fmtNum(p.views) },
    { key: "clicks", label: "제휴 클릭", align: "right", value: (p) => p.clicks, render: (p) => <span className="font-semibold text-pink-700">{fmtNum(p.clicks)}</span> },
    { key: "ctr", label: "클릭률", align: "right", hint: "제휴 클릭 ÷ 조회수", value: (p) => p.ctr, render: (p) => fmtPct(p.ctr, 1) },
    { key: "split", label: "어디로", value: (p) => Object.keys(p.partners).join(", "), render: (p) => <span className="text-gray-500">{Object.entries(p.partners).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(" · ")}</span> },
  ];

  const scrollRows = r.pages
    .filter((p) => p.screenPageViews >= 10 && !isBrokenTitle(p.pageTitle))
    .map((p) => ({ p, rate: Math.min(1, ratio(p.scrolls, p.screenPageViews)) }))
    .sort((a, b) => b.rate - a.rate);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile i={0} label="제휴사 클릭" value={d.partnerClicks} format={fmtNum} prev={compare ? d.prevPartnerClicks : undefined} hint={hint("partner")} sub="예약·제휴 사이트로 나간 클릭" />
        <KpiTile i={1} label="제휴 클릭률" value={ratio(d.partnerClicks, partnerPageViews)} format={(n) => fmtPct(n, 1)} sub="제휴 링크가 있는 페이지 조회 대비" />
        <KpiTile i={2} label="그 밖의 외부 클릭" value={d.otherOutbound.reduce((n, o) => n + o.eventCount, 0)} format={fmtNum} sub="인스타그램, 에어비앤비, 관광 사이트 등" />
        <KpiTile i={3} label="입력 양식 제출" value={formSubmit} format={fmtNum} sub={formStart ? `작성 시작 ${fmtNum(formStart)}회 중 ${fmtPct(ratio(formSubmit, formStart), 0)} 완료` : "작성 시작이 없습니다"} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="ga-rise" title="제휴 프로그램별 클릭" help={hint("partner")} subtitle="방문자가 누른 제휴 링크">
          <BarList
            empty="이 기간에는 제휴 사이트 클릭이 없습니다."
            rows={d.partners.map((p) => ({
              key: p.name,
              label: p.name,
              text: p.domains.join(", "),
              value: p.clicks,
              display: `${fmtNum(p.clicks)}회`,
              sub: `${fmtNum(p.users)}명`,
              prev: compare ? p.prevClicks : undefined,
              color: "#ff2e97",
            }))}
          />
        </Card>
        <Card className="ga-rise lg:col-span-2" title="돈이 되는 페이지" help="제휴 클릭이 나온 페이지와 클릭률(클릭 ÷ 조회)입니다. 클릭률이 높은 글은 비슷한 글을 더 만들고, 조회는 많은데 클릭률이 낮은 글은 버튼 위치와 문구를 손봅니다." subtitle="페이지별 제휴 클릭과 클릭률">
          <DataTable
            rows={d.partnerPages}
            columns={partnerPageCols}
            defaultSort={{ key: "clicks", desc: true }}
            filename="partner-clicks-by-page"
            empty="이 기간에는 제휴 사이트 클릭이 없습니다."
            onRowClick={(p) => openDrill({ dimension: "pagePath", value: p.path, label: p.title })}
          />
        </Card>
      </div>

      {wts && (
        <Card className="ga-rise" title="Where to Stay (숙소 페이지)" subtitle="인스타 릴스가 사람을 보내는 호텔 페이지의 성과">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {[
              { label: "조회", value: `${fmtNum(wts.screenPageViews)}회` },
              { label: "사용자", value: `${fmtNum(wts.activeUsers)}명` },
              { label: "1인당 시간", value: fmtDuration(ratio(wts.userEngagementDuration, wts.activeUsers)) },
              { label: "예약 사이트 클릭", value: `${fmtNum(wtsClicks?.clicks ?? 0)}회` },
              { label: "클릭률", value: fmtPct(ratio(wtsClicks?.clicks ?? 0, wts.screenPageViews), 1) },
            ].map((k) => (
              <div key={k.label}>
                <p className="text-[11.5px] text-gray-500">{k.label}</p>
                <p className="mt-0.5 text-[22px] font-bold text-primary">{k.value}</p>
              </div>
            ))}
          </div>
          {wtsClicks && (
            <div className="mt-5">
              <p className="mb-2 text-[11.5px] font-medium text-gray-500">방문자가 고른 예약 사이트</p>
              <ShareBar format={fmtNum} parts={Object.entries(wtsClicks.partners).sort((a, b) => partnerRank(a[0]) - partnerRank(b[0])).map(([name, v]) => ({ label: name, value: v, color: partnerColor(name) }))} />
            </div>
          )}
          <button type="button" onClick={() => openDrill({ dimension: "pagePath", value: "/where-to-stay", label: wts.pageTitle })} className="mt-4 text-[12px] font-semibold text-primary hover:text-accent">
            이 페이지에 어디서 왔는지 보기 →
          </button>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="ga-rise lg:col-span-2" title="모든 행동 (이벤트)" help={hint("event")} subtitle="GA4가 기록한 모든 행동. 중요한 것은 GA4에서 '핵심 이벤트'로 지정하세요.">
          <DataTable
            rows={r.events}
            columns={eventCols}
            defaultSort={{ key: "count", desc: true }}
            search={(e) => `${e.eventName} ${eventKo(e.eventName) ?? ""}`}
            filename="events"
            onRowClick={(e) => openDrill({ dimension: "eventName", value: e.eventName, label: eventKo(e.eventName) ?? e.eventName })}
          />
        </Card>
        <Card className="ga-rise" title="그 밖의 외부 링크" subtitle="제휴가 아닌 사이트로 나간 클릭">
          <BarList
            limit={10}
            empty="그 밖의 외부 클릭이 없습니다."
            rows={d.otherOutbound.map((o) => ({
              key: o.linkDomain,
              label: o.linkDomain,
              value: o.eventCount,
              display: `${fmtNum(o.eventCount)}회`,
              sub: `${fmtNum(o.totalUsers)}명`,
              prev: compare ? o.prev?.eventCount ?? 0 : undefined,
            }))}
          />
        </Card>
      </div>

      <Card className="ga-rise" title="끝까지 읽은 비율" help={hint("scroll")} subtitle="조회 10회 이상인 페이지 · 페이지를 90%까지 내린 비율. 긴 가이드에서 낮으면 중간에 그만 읽는다는 뜻입니다.">
        <BarList
          limit={12}
          rows={scrollRows.map(({ p, rate }) => ({
            key: p.pagePath,
            label: short(p.pageTitle || p.pagePath),
            text: p.pagePath,
            value: rate,
            display: fmtPct(rate, 0),
            sub: `조회 ${fmtNum(p.screenPageViews)}회`,
            onClick: () => openDrill({ dimension: "pagePath", value: p.pagePath, label: p.pageTitle }),
          }))}
          max={1}
        />
      </Card>
    </div>
  );
}
