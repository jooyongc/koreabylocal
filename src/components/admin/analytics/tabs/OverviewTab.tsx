import { useState } from "react";
import { Card, Segmented } from "../ui";
import { InsightCards, KpiTile } from "../cards";
import { LineChart } from "../charts/LineChart";
import { BarList } from "../charts/BarList";
import { Heatmap } from "../charts/Heatmap";
import { ShareBar } from "../charts/misc";
import { useOpenDrill } from "../context";
import {
  COMPARE, SERIES, channelColor, deviceColor, flag, fmtDuration, fmtNum, fmtPct, fmtRange, ratio,
} from "../format";
import { short, type Insight } from "../insights";
import type { Derived } from "../derive";
import type { DailyRow, Report } from "../types";

type TrendKey = "activeUsers" | "newUsers" | "sessions" | "engagedSessions" | "screenPageViews" | "engagement";

const TRENDS: Array<{ key: TrendKey; label: string; value: (d: DailyRow) => number; format: (n: number) => string }> = [
  { key: "activeUsers", label: "Users", value: (d) => d.activeUsers, format: fmtNum },
  { key: "newUsers", label: "New users", value: (d) => d.newUsers, format: fmtNum },
  { key: "sessions", label: "Sessions", value: (d) => d.sessions, format: fmtNum },
  { key: "engagedSessions", label: "Engaged sessions", value: (d) => d.engagedSessions, format: fmtNum },
  { key: "screenPageViews", label: "Views", value: (d) => d.screenPageViews, format: fmtNum },
  { key: "engagement", label: "Engagement / user", value: (d) => ratio(d.userEngagementDuration, d.activeUsers), format: fmtDuration },
];

export function OverviewTab({ r, d, insights }: { r: Report; d: Derived; insights: Insight[] }) {
  const openDrill = useOpenDrill();
  const [trend, setTrend] = useState<TrendKey>("activeUsers");
  const [zone, setZone] = useState<"kst" | "property">("kst");
  const [heatMetric, setHeatMetric] = useState<"engaged" | "sessions">("engaged");

  const t = r.totals.current;
  const p = r.totals.previous;
  const daily = r.daily.current;
  const prevDaily = r.daily.previous;
  const spec = TRENDS.find((x) => x.key === trend)!;
  const compareLabel = r.compare ? (r.compare.mode === "year" ? "Same weeks last year" : "Previous period") : "";

  const tiles = [
    { key: "activeUsers" as const, label: "Users", value: t.activeUsers, prev: p?.activeUsers, format: fmtNum, hint: "Distinct people who visited (GA4 active users)." },
    { key: "newUsers" as const, label: "New users", value: t.newUsers, prev: p?.newUsers, format: fmtNum, sub: `${fmtPct(ratio(t.newUsers, t.activeUsers), 0)} of users are first-timers` },
    { key: "sessions" as const, label: "Sessions", value: t.sessions, prev: p?.sessions, format: fmtNum, sub: `${ratio(t.sessions, t.activeUsers).toFixed(2)} per user` },
    { key: "engagedSessions" as const, label: "Engaged sessions", value: t.engagedSessions, prev: p?.engagedSessions, format: fmtNum, sub: `${fmtPct(d.engagementRate)} engagement rate`, hint: "Sessions that lasted 10s+, viewed 2+ pages, or fired a key event." },
    { key: "screenPageViews" as const, label: "Page views", value: t.screenPageViews, prev: p?.screenPageViews, format: fmtNum, sub: `${ratio(t.screenPageViews, t.sessions).toFixed(2)} per session` },
    { key: "engagement" as const, label: "Engagement / user", value: d.secondsPerUser, prev: p ? ratio(p.userEngagementDuration, p.activeUsers) : undefined, format: fmtDuration, hint: "Average time the page was in focus, per user." },
  ];

  const heat = r.heatmap[zone][heatMetric];
  const zoneLabel = zone === "kst" ? "Korea time (KST)" : `Property time (${r.timeZone})`;

  const userType = r.userType.filter((u) => u.newVsReturning === "new" || u.newVsReturning === "returning");

  return (
    <div className="space-y-5">
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
          label="Bounce rate"
          value={t.bounceRate}
          format={(n) => fmtPct(n)}
          prev={r.compare ? p?.bounceRate ?? null : undefined}
          lowerIsBetter
          sub="Sessions with no engagement"
          spark={daily.map((x) => 1 - ratio(x.engagedSessions, x.sessions))}
        />
        <KpiTile
          i={7}
          label="Partner clicks"
          value={d.partnerClicks}
          format={fmtNum}
          prev={r.compare ? d.prevPartnerClicks : undefined}
          sub={d.partners[0] ? `Top: ${d.partners[0].name} (${fmtNum(d.partners[0].clicks)})` : "Outbound clicks to affiliate partners"}
          hint="Outbound link clicks to Expedia, Hotels.com, Trip.com, Agoda, Booking.com, Klook and Olive Young (GA4 enhanced measurement)."
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card
          className="ga-rise xl:col-span-2"
          title={`${spec.label} per day`}
          subtitle={`${fmtRange(r.range.startDate, r.range.endDate)}${r.compare ? ` · grey: ${compareLabel.toLowerCase()} (${fmtRange(r.compare.startDate, r.compare.endDate)})` : ""}`}
          actions={
            <Segmented size="sm" value={trend} onChange={setTrend} options={TRENDS.map((x) => ({ value: x.key, label: x.label }))} />
          }
        >
          <LineChart
            ariaLabel={`${spec.label} per day`}
            dates={daily.map((x) => x.date)}
            format={spec.format}
            height={270}
            series={[
              { key: "cur", label: "This period", color: SERIES[0], area: true, values: daily.map(spec.value) },
              ...(prevDaily.length ? [{ key: "prev", label: compareLabel, color: COMPARE, muted: true, dates: prevDaily.map((x) => x.date), values: prevDaily.map(spec.value) }] : []),
            ]}
          />
        </Card>

        <Card className="ga-rise" title="How visitors arrive" subtitle="Sessions by channel · engagement rate">
          <BarList
            limit={8}
            rows={r.channels.filter((c) => c.sessions > 0).map((c) => ({
              key: c.sessionDefaultChannelGroup,
              label: c.sessionDefaultChannelGroup,
              value: c.sessions,
              display: fmtNum(c.sessions),
              sub: `${fmtPct(ratio(c.engagedSessions, c.sessions), 0)} eng.`,
              prev: r.compare ? c.prev?.sessions ?? 0 : undefined,
              color: channelColor(c.sessionDefaultChannelGroup),
              onClick: () => openDrill({ dimension: "sessionDefaultChannelGroup", value: c.sessionDefaultChannelGroup }),
            }))}
          />
        </Card>
      </div>

      <Card className="ga-rise" title="What the data says" subtitle="Read automatically from this period's numbers — every figure links to the detail behind it.">
        <InsightCards insights={insights} />
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card
          className="ga-rise xl:col-span-2"
          title="When visitors come"
          subtitle="Weekday × hour — plan posting and email times around it"
          actions={
            <>
              <Segmented size="sm" value={heatMetric} onChange={setHeatMetric} options={[{ value: "engaged", label: "Engaged" }, { value: "sessions", label: "All sessions" }]} />
              <Segmented size="sm" value={zone} onChange={setZone} options={[{ value: "kst", label: "KST" }, { value: "property", label: "LA", title: r.timeZone }]} />
            </>
          }
        >
          <Heatmap matrix={heat} unit={heatMetric === "engaged" ? "engaged sessions" : "sessions"} zoneLabel={zoneLabel} />
        </Card>

        <Card className="ga-rise" title="Who they are">
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-[11.5px] font-medium text-gray-500">Countries · users</p>
              <BarList
                limit={6}
                rows={r.countries.filter((c) => c.activeUsers > 0).map((c) => ({
                  key: c.country,
                  label: <><span className="mr-1">{flag(c.countryId)}</span>{c.country}</>,
                  text: c.country,
                  value: c.activeUsers,
                  display: fmtNum(c.activeUsers),
                  sub: `${fmtPct(ratio(c.engagedSessions, c.sessions), 0)} eng.`,
                  onClick: () => openDrill({ dimension: "country", value: c.country }),
                }))}
              />
            </div>
            <div>
              <p className="mb-2 text-[11.5px] font-medium text-gray-500">Devices · users</p>
              <ShareBar format={fmtNum} parts={r.devices.map((x) => ({ label: x.deviceCategory, value: x.activeUsers, color: deviceColor(x.deviceCategory) }))} />
            </div>
            {userType.length > 0 && (
              <div>
                <p className="mb-2 text-[11.5px] font-medium text-gray-500">New vs returning · users</p>
                <ShareBar format={fmtNum} parts={userType.map((u) => ({ label: u.newVsReturning, value: u.activeUsers, color: u.newVsReturning === "new" ? SERIES[0] : SERIES[1] }))} />
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="ga-rise" title="Most read" subtitle="Views · engagement time per user">
          <BarList
            limit={8}
            rows={r.pages.slice(0, 40).map((pg) => ({
              key: pg.pagePath,
              label: short(pg.pageTitle || pg.pagePath),
              text: pg.pagePath,
              value: pg.screenPageViews,
              display: fmtNum(pg.screenPageViews),
              sub: fmtDuration(ratio(pg.userEngagementDuration, pg.activeUsers)),
              prev: r.compare ? pg.prevViews : undefined,
              onClick: () => openDrill({ dimension: "pagePath", value: pg.pagePath, label: pg.pageTitle }),
            }))}
          />
        </Card>
        <Card className="ga-rise" title="Clicks to booking partners" subtitle="Outbound clicks to affiliate programmes">
          <BarList
            empty="No partner clicks in this period."
            rows={d.partners.map((pt) => ({
              key: pt.name,
              label: pt.name,
              text: pt.domains.join(", "),
              value: pt.clicks,
              display: fmtNum(pt.clicks),
              sub: `${fmtNum(pt.users)} users`,
              prev: r.compare ? pt.prevClicks : undefined,
              color: "#ff2e97",
            }))}
          />
          {d.partnerPages.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-[11.5px] font-medium text-gray-500">Pages that send them</p>
              <BarList
                limit={5}
                rows={d.partnerPages.map((pp) => ({
                  key: pp.path,
                  label: short(pp.title),
                  text: pp.path,
                  value: pp.clicks,
                  display: fmtNum(pp.clicks),
                  sub: pp.views ? `${fmtPct(pp.ctr, 0)} of views` : undefined,
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
