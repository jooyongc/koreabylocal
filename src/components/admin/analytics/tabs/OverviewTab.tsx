import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Card, Segmented } from "../ui";
import { InsightCards, KpiTile } from "../cards";
import { SummaryText } from "../GlossaryDrawer";
import { LineChart } from "../charts/LineChart";
import { BarList } from "../charts/BarList";
import { Heatmap } from "../charts/Heatmap";
import { ShareBar } from "../charts/misc";
import { useOpenDrill } from "../context";
import {
  COMPARE, SERIES, channelColor, channelKo, countryKo, deviceColor, deviceKo, flag, fmtDuration, fmtNum, fmtPct, fmtRange, ratio, userTypeKo,
} from "../format";
import { hint } from "../glossary";
import { short, type Insight } from "../insights";
import type { Derived, Gap } from "../derive";
import type { Part } from "../summary";
import type { DailyRow, Report } from "../types";

type TrendKey = "activeUsers" | "newUsers" | "sessions" | "engagedSessions" | "screenPageViews" | "engagement";

// A day with no sessions has no ratio: NaN breaks the line instead of drawing a fake 0% or 100%.
const per = (a: number, b: number) => (b > 0 ? a / b : NaN);

const TRENDS: Array<{ key: TrendKey; label: string; value: (d: DailyRow) => number; format: (n: number) => string }> = [
  { key: "activeUsers", label: "사용자", value: (d) => d.activeUsers, format: (n) => `${fmtNum(n)}명` },
  { key: "newUsers", label: "신규", value: (d) => d.newUsers, format: (n) => `${fmtNum(n)}명` },
  { key: "sessions", label: "방문", value: (d) => d.sessions, format: (n) => `${fmtNum(n)}회` },
  { key: "engagedSessions", label: "참여 방문", value: (d) => d.engagedSessions, format: (n) => `${fmtNum(n)}회` },
  { key: "screenPageViews", label: "조회", value: (d) => d.screenPageViews, format: (n) => `${fmtNum(n)}회` },
  { key: "engagement", label: "참여 시간", value: (d) => per(d.userEngagementDuration, d.activeUsers), format: fmtDuration },
];

export function OverviewTab({ r, d, insights, summary, gaps }: { r: Report; d: Derived; insights: Insight[]; summary: Part[][]; gaps: Gap[] }) {
  const openDrill = useOpenDrill();
  const [trend, setTrend] = useState<TrendKey>("activeUsers");
  const [zone, setZone] = useState<"kst" | "property">("kst");
  const [heatMetric, setHeatMetric] = useState<"engaged" | "sessions">("engaged");

  const t = r.totals.current;
  const p = r.totals.previous;
  const daily = r.daily.current;
  const prevDaily = r.daily.previous;
  const spec = TRENDS.find((x) => x.key === trend)!;
  const compareLabel = r.compare ? (r.compare.mode === "year" ? "작년 같은 주" : "이전 기간") : "";
  const newShare = Math.min(1, ratio(t.newUsers, t.activeUsers));

  const tiles = [
    { key: "activeUsers" as const, label: "사용자", value: t.activeUsers, prev: p?.activeUsers, format: fmtNum, hint: hint("users"), sub: "들어온 사람 수 (중복 없이)" },
    { key: "newUsers" as const, label: "신규 사용자", value: t.newUsers, prev: p?.newUsers, format: fmtNum, hint: hint("newUsers"), sub: newShare > 0.97 ? "거의 모두 처음 온 사람" : `${fmtPct(newShare, 0)}가 처음 온 사람` },
    { key: "sessions" as const, label: "방문 (세션)", value: t.sessions, prev: p?.sessions, format: fmtNum, hint: hint("sessions"), sub: `1인당 ${ratio(t.sessions, t.activeUsers).toFixed(2)}회` },
    { key: "engagedSessions" as const, label: "참여 방문", value: t.engagedSessions, prev: p?.engagedSessions, format: fmtNum, hint: hint("engaged"), sub: `참여율 ${fmtPct(d.engagementRate)}` },
    { key: "screenPageViews" as const, label: "페이지 조회", value: t.screenPageViews, prev: p?.screenPageViews, format: fmtNum, hint: hint("views"), sub: `방문당 ${ratio(t.screenPageViews, t.sessions).toFixed(2)}페이지` },
    { key: "engagement" as const, label: "1인당 참여 시간", value: d.secondsPerUser, prev: p ? ratio(p.userEngagementDuration, p.activeUsers) : undefined, format: fmtDuration, hint: hint("engagementTime"), sub: "화면을 실제로 본 시간" },
  ];

  const heat = r.heatmap[zone][heatMetric];
  const zoneLabel = zone === "kst" ? "한국 시간 기준" : `GA4 속성 시간(${r.timeZone}) 기준`;
  const userType = r.userType.filter((u) => u.newVsReturning === "new" || u.newVsReturning === "returning");

  return (
    <div className="space-y-5">
      <section className="ga-rise relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl" aria-hidden />
        <h2 className="mb-3 flex items-center gap-1.5 text-[13.5px] font-semibold text-primary">
          <Sparkles className="h-4 w-4 text-accent" aria-hidden /> 한눈에 보기
        </h2>
        <SummaryText lines={summary} />
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map((tile, i) => (
          <KpiTile
            key={tile.key}
            i={i}
            label={tile.label}
            value={tile.value}
            format={tile.format}
            prev={r.compare ? tile.prev ?? null : undefined}
            sub={tile.sub}
            hint={tile.hint}
            spark={daily.map(TRENDS.find((x) => x.key === tile.key)!.value)}
            active={trend === tile.key}
            onClick={() => setTrend(tile.key)}
          />
        ))}
        <KpiTile
          i={6}
          label="이탈률"
          value={t.bounceRate}
          format={(n) => fmtPct(n)}
          prev={r.compare ? p?.bounceRate ?? null : undefined}
          lowerIsBetter
          hint={hint("bounce")}
          sub="참여 없이 나간 방문 (낮을수록 좋음)"
          spark={daily.map((x) => (x.sessions > 0 ? 1 - x.engagedSessions / x.sessions : NaN))}
        />
        <KpiTile
          i={7}
          label="제휴사 클릭"
          value={d.partnerClicks}
          format={fmtNum}
          prev={r.compare ? d.prevPartnerClicks : undefined}
          hint={hint("partner")}
          sub={d.partners[0] ? `가장 많이: ${d.partners[0].name} ${fmtNum(d.partners[0].clicks)}회` : "예약·제휴 사이트로 나간 클릭"}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card
          className="ga-rise xl:col-span-2"
          title={`날짜별 ${spec.label}`}
          help="위 숫자 카드를 누르면 그 지표로 바뀝니다. 진한 선이 이번 기간이고, 회색 선은 비교 기간입니다(같은 위치 = 같은 순서의 날). 회색 바탕은 GA4가 데이터를 받지 못한 날입니다. 선 위에 마우스를 올리면 그날 숫자가 나옵니다."
          subtitle={`${fmtRange(r.range.startDate, r.range.endDate)}${r.compare ? ` · 회색 선: ${compareLabel} (${fmtRange(r.compare.startDate, r.compare.endDate)})` : ""}`}
          actions={<Segmented size="sm" value={trend} onChange={setTrend} options={TRENDS.map((x) => ({ value: x.key, label: x.label }))} />}
        >
          <LineChart
            ariaLabel={`날짜별 ${spec.label}`}
            dates={daily.map((x) => x.date)}
            format={spec.format}
            height={270}
            gaps={gaps.map((g) => ({ from: g.from, to: g.to }))}
            series={[
              { key: "cur", label: "이번 기간", color: SERIES[0], area: true, values: daily.map(spec.value) },
              ...(prevDaily.length ? [{ key: "prev", label: compareLabel, color: COMPARE, muted: true, dates: prevDaily.map((x) => x.date), values: prevDaily.map(spec.value) }] : []),
            ]}
          />
        </Card>

        <Card className="ga-rise" title="어디서 왔나요" help={hint("channel")} subtitle="경로별 방문 수 · 오른쪽 %는 참여율">
          <BarList
            limit={8}
            rows={r.channels.filter((c) => c.sessions > 0).map((c) => ({
              key: c.sessionDefaultChannelGroup,
              label: channelKo(c.sessionDefaultChannelGroup),
              text: `GA4: ${c.sessionDefaultChannelGroup}`,
              value: c.sessions,
              display: `${fmtNum(c.sessions)}회`,
              sub: `참여 ${fmtPct(ratio(c.engagedSessions, c.sessions), 0)}`,
              prev: r.compare ? c.prev?.sessions ?? 0 : undefined,
              color: channelColor(c.sessionDefaultChannelGroup),
              onClick: () => openDrill({ dimension: "sessionDefaultChannelGroup", value: c.sessionDefaultChannelGroup, label: channelKo(c.sessionDefaultChannelGroup) }),
            }))}
          />
        </Card>
      </div>

      <Card className="ga-rise" title="데이터가 말해 주는 것" subtitle="이번 기간 숫자를 자동으로 읽은 결과입니다. '자세히 보기'를 누르면 근거가 되는 숫자가 열립니다.">
        <InsightCards insights={insights} />
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card
          className="ga-rise xl:col-span-2"
          title="언제 들어오나요"
          help="가로는 시간(0~23시), 세로는 요일입니다. 칸이 진할수록 그 시간에 방문이 많았습니다. ★가 가장 붐비는 시간입니다. '참여'로 보면 봇을 뺀 실제 독자 기준이라 게시 시간 정하기에 좋습니다."
          subtitle="요일 × 시간 — 릴스·게시물·뉴스레터 보내는 시간을 정할 때"
          actions={
            <>
              <Segmented size="sm" value={heatMetric} onChange={setHeatMetric} options={[{ value: "engaged", label: "참여 방문" }, { value: "sessions", label: "전체 방문" }]} />
              <Segmented size="sm" value={zone} onChange={setZone} options={[{ value: "kst", label: "한국" }, { value: "property", label: "LA", title: r.timeZone }]} />
            </>
          }
        >
          <Heatmap matrix={heat} unit={heatMetric === "engaged" ? "참여 방문" : "방문"} zoneLabel={zoneLabel} />
        </Card>

        <Card className="ga-rise" title="누가 오나요">
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-[11.5px] font-medium text-gray-500">나라 · 사용자 수 (오른쪽 %는 참여율)</p>
              <BarList
                limit={6}
                rows={r.countries.filter((c) => c.activeUsers > 0).map((c) => ({
                  key: c.country,
                  label: <><span className="mr-1">{flag(c.countryId)}</span>{countryKo(c.countryId, c.country)}</>,
                  text: c.country,
                  value: c.activeUsers,
                  display: `${fmtNum(c.activeUsers)}명`,
                  sub: `참여 ${fmtPct(ratio(c.engagedSessions, c.sessions), 0)}`,
                  onClick: () => openDrill({ dimension: "country", value: c.country, label: countryKo(c.countryId, c.country) }),
                }))}
              />
            </div>
            <div>
              <p className="mb-2 text-[11.5px] font-medium text-gray-500">기기 · 사용자 비율</p>
              <ShareBar format={fmtNum} parts={r.devices.map((x) => ({ label: deviceKo(x.deviceCategory), value: x.activeUsers, color: deviceColor(x.deviceCategory) }))} />
            </div>
            {userType.length > 0 && (
              <div>
                <p className="mb-2 text-[11.5px] font-medium text-gray-500">처음 온 사람 vs 다시 온 사람</p>
                <ShareBar format={fmtNum} parts={userType.map((u) => ({ label: userTypeKo(u.newVsReturning), value: u.activeUsers, color: u.newVsReturning === "new" ? SERIES[0] : SERIES[1] }))} />
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="ga-rise" title="많이 본 페이지" subtitle="조회수 · 오른쪽은 1인당 참여 시간" help="누르면 그 페이지에 어디서 왔는지, 어느 나라·기기인지, 어디로 나갔는지가 열립니다.">
          <BarList
            limit={8}
            rows={r.pages.slice(0, 40).map((pg) => ({
              key: pg.pagePath,
              label: short(pg.pageTitle || pg.pagePath),
              text: pg.pagePath,
              value: pg.screenPageViews,
              display: `${fmtNum(pg.screenPageViews)}회`,
              sub: fmtDuration(ratio(pg.userEngagementDuration, pg.activeUsers)),
              prev: r.compare ? pg.prevViews : undefined,
              onClick: () => openDrill({ dimension: "pagePath", value: pg.pagePath, label: pg.pageTitle }),
            }))}
          />
        </Card>
        <Card className="ga-rise" title="예약·제휴 사이트로 나간 클릭" help={hint("partner")} subtitle="제휴 프로그램별 클릭 수">
          <BarList
            empty="이 기간에는 제휴 사이트 클릭이 없습니다."
            rows={d.partners.map((pt) => ({
              key: pt.name,
              label: pt.name,
              text: pt.domains.join(", "),
              value: pt.clicks,
              display: `${fmtNum(pt.clicks)}회`,
              sub: `${fmtNum(pt.users)}명`,
              prev: r.compare ? pt.prevClicks : undefined,
              color: "#ff2e97",
            }))}
          />
          {d.partnerPages.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-[11.5px] font-medium text-gray-500">클릭을 보낸 페이지 (오른쪽 %는 조회 대비 클릭률)</p>
              <BarList
                limit={5}
                rows={d.partnerPages.map((pp) => ({
                  key: pp.path,
                  label: short(pp.title),
                  text: pp.path,
                  value: pp.clicks,
                  display: `${fmtNum(pp.clicks)}회`,
                  sub: pp.views ? `클릭률 ${fmtPct(pp.ctr, 0)}` : undefined,
                  onClick: () => openDrill({ dimension: "pagePath", value: pp.path, label: pp.title }),
                }))}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
