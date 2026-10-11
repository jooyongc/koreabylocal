import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, ExternalLink, X } from "lucide-react";
import { useDrill } from "./useAnalytics";
import { LineChart } from "./charts/LineChart";
import { BarList } from "./charts/BarList";
import { KpiTile } from "./cards";
import {
  COMPARE, SERIES, deviceColor, flag, fmtDuration, fmtNum, fmtPct, fmtRange, partnerOf, ratio,
} from "./format";
import { short } from "./insights";
import type { DrillDimension, DrillTarget, RangeParams } from "./types";

const KIND: Record<DrillDimension, string> = {
  pagePath: "Page",
  landingPage: "Landing page",
  sessionDefaultChannelGroup: "Channel",
  sessionSourceMedium: "Source / medium",
  sessionCampaignName: "Campaign",
  country: "Country",
  deviceCategory: "Device",
  eventName: "Event",
  newVsReturning: "Visitor type",
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200/80 bg-white p-4">
      <h3 className="mb-3 text-[12.5px] font-semibold text-primary">{title}</h3>
      {children}
    </section>
  );
}

/** Everything about one page / channel / source / campaign / country / device / event. */
export function DrillDrawer({ target, params, onClose, onDrill }: {
  target: DrillTarget;
  params: RangeParams;
  onClose: () => void;
  onDrill: (t: DrillTarget) => void;
}) {
  const { data, error, isLoading } = useDrill(target, params);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const isPage = target.dimension === "pagePath" || target.dimension === "landingPage";
  const title = target.label ?? (isPage ? data?.pages.find((p) => p.pagePath === target.value)?.pageTitle : undefined);

  const cur = data?.totals.current;
  const prev = data?.totals.previous ?? null;
  const daily = data?.daily.current ?? [];
  const prevDaily = data?.daily.previous ?? [];

  return createPortal(
    <div className="fixed inset-0 z-[70] flex justify-end" role="dialog" aria-modal="true" aria-label={`${KIND[target.dimension]} details`}>
      <button type="button" aria-label="Close" onClick={onClose} className="ga-fade absolute inset-0 bg-primary/30 backdrop-blur-[2px]" />
      <div className="ga-slide-in relative flex h-full w-full max-w-[760px] flex-col overflow-hidden bg-[#f7f7f5] shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-gray-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">{KIND[target.dimension]}</p>
            <h2 className="mt-0.5 truncate text-[17px] font-bold text-primary" title={title ?? target.value}>
              {title ? short(title, 90) : target.value}
            </h2>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11.5px] text-gray-500">
              {isPage && <span className="font-mono">{target.value}</span>}
              {data && <span>{fmtRange(data.range.startDate, data.range.endDate)}</span>}
              {isPage && (
                <a href={`https://koreabylocal.com${target.value}`} target="_blank" rel="noopener" className="inline-flex items-center gap-0.5 font-medium text-primary hover:text-accent">
                  Open page <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100" aria-label="Close details">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {isLoading && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Array.from({ length: 6 }, (_, i) => <div key={i} className="ga-shimmer h-24 rounded-2xl" />)}
              </div>
              <div className="ga-shimmer h-64 rounded-2xl" />
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-[12.5px] text-amber-900">
              <AlertTriangle className="h-4 w-4 shrink-0" />{(error as Error).message}
            </div>
          )}

          {data && cur && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <KpiTile i={0} label="Users" value={cur.activeUsers} format={fmtNum} prev={prev?.activeUsers ?? null} spark={daily.map((d) => d.activeUsers)} />
                <KpiTile i={1} label="Sessions" value={cur.sessions} format={fmtNum} prev={prev?.sessions ?? null} spark={daily.map((d) => d.sessions)} />
                <KpiTile i={2} label="Engagement rate" value={ratio(cur.engagedSessions, cur.sessions)} format={(n) => fmtPct(n)} prev={prev ? ratio(prev.engagedSessions, prev.sessions) : null} sub={`${fmtNum(cur.engagedSessions)} engaged sessions`} />
                <KpiTile i={3} label="Views" value={cur.screenPageViews} format={fmtNum} prev={prev?.screenPageViews ?? null} spark={daily.map((d) => d.screenPageViews)} />
                <KpiTile i={4} label="Engagement / user" value={ratio(cur.userEngagementDuration, cur.activeUsers)} format={fmtDuration} prev={prev ? ratio(prev.userEngagementDuration, prev.activeUsers) : null} />
                <KpiTile i={5} label="New users" value={cur.newUsers} format={fmtNum} prev={prev?.newUsers ?? null} sub={`${fmtPct(ratio(cur.newUsers, cur.activeUsers), 0)} of users`} />
              </div>

              <Section title={isPage ? "Views per day" : "Users per day"}>
                <LineChart
                  ariaLabel="Daily trend"
                  dates={daily.map((d) => d.date)}
                  format={fmtNum}
                  height={220}
                  series={[
                    { key: "cur", label: "This period", color: SERIES[0], area: true, values: daily.map((d) => (isPage ? d.screenPageViews : d.activeUsers)) },
                    ...(prevDaily.length ? [{ key: "prev", label: "Comparison", color: COMPARE, muted: true, dates: prevDaily.map((d) => d.date), values: prevDaily.map((d) => (isPage ? d.screenPageViews : d.activeUsers)) }] : []),
                  ]}
                />
              </Section>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {target.dimension !== "sessionSourceMedium" && (
                  <Section title="Where they come from">
                    <BarList
                      limit={6}
                      rows={data.sources.map((s) => ({
                        key: `${s.sessionSource}/${s.sessionMedium}`,
                        label: `${s.sessionSource} / ${s.sessionMedium}`,
                        text: `${s.sessionSource} / ${s.sessionMedium}`,
                        value: s.sessions,
                        display: fmtNum(s.sessions),
                        sub: `${fmtPct(ratio(s.engagedSessions, s.sessions), 0)} eng.`,
                        onClick: () => onDrill({ dimension: "sessionSourceMedium", value: `${s.sessionSource} / ${s.sessionMedium}` }),
                      }))}
                    />
                  </Section>
                )}
                {!isPage && (
                  <Section title="Pages they read">
                    <BarList
                      limit={6}
                      rows={data.pages.map((p) => ({
                        key: p.pagePath + p.pageTitle,
                        label: short(p.pageTitle || p.pagePath, 50),
                        text: p.pagePath,
                        value: p.screenPageViews,
                        display: fmtNum(p.screenPageViews),
                        sub: fmtDuration(ratio(p.userEngagementDuration, p.activeUsers)),
                        onClick: () => onDrill({ dimension: "pagePath", value: p.pagePath, label: p.pageTitle }),
                      }))}
                    />
                  </Section>
                )}
                {target.dimension !== "landingPage" && (
                  <Section title="Where they land">
                    <BarList
                      limit={6}
                      rows={data.landing.map((l) => ({
                        key: l.landingPage,
                        label: l.landingPage,
                        value: l.sessions,
                        display: fmtNum(l.sessions),
                        sub: `${fmtPct(ratio(l.engagedSessions, l.sessions), 0)} eng.`,
                        onClick: l.landingPage !== "(not set)" ? () => onDrill({ dimension: "landingPage", value: l.landingPage }) : undefined,
                      }))}
                    />
                  </Section>
                )}
                {target.dimension !== "country" && (
                  <Section title="Countries">
                    <BarList
                      limit={6}
                      rows={data.countries.map((c) => ({
                        key: c.country,
                        label: <><span className="mr-1">{flag(c.countryId)}</span>{c.country}</>,
                        text: c.country,
                        value: c.activeUsers,
                        display: fmtNum(c.activeUsers),
                        sub: `${fmtPct(ratio(c.engagedSessions, c.sessions), 0)} eng.`,
                        onClick: () => onDrill({ dimension: "country", value: c.country }),
                      }))}
                    />
                  </Section>
                )}
                {target.dimension !== "deviceCategory" && (
                  <Section title="Devices">
                    <BarList
                      rows={data.devices.map((dv) => ({
                        key: dv.deviceCategory,
                        label: dv.deviceCategory,
                        value: dv.activeUsers,
                        display: fmtNum(dv.activeUsers),
                        color: deviceColor(dv.deviceCategory),
                        sub: `${fmtPct(ratio(dv.engagedSessions, dv.sessions), 0)} eng.`,
                      }))}
                    />
                  </Section>
                )}
                <Section title="Outbound clicks">
                  <BarList
                    limit={6}
                    empty="No outbound clicks."
                    rows={data.outbound.map((o) => ({
                      key: o.linkDomain,
                      label: <>{o.linkDomain}{partnerOf(o.linkDomain) && <span className="ml-1.5 rounded bg-pink-50 px-1 text-[10px] font-semibold text-pink-800">partner</span>}</>,
                      text: o.linkDomain,
                      value: o.eventCount,
                      display: fmtNum(o.eventCount),
                      color: partnerOf(o.linkDomain) ? "#ff2e97" : undefined,
                    }))}
                  />
                </Section>
                {target.dimension !== "eventName" && (
                  <Section title="Events">
                    <BarList
                      limit={8}
                      rows={data.events.map((e) => ({
                        key: e.eventName,
                        label: e.eventName,
                        value: e.eventCount,
                        display: fmtNum(e.eventCount),
                        sub: `${fmtNum(e.totalUsers)} users`,
                        color: SERIES[2],
                      }))}
                    />
                  </Section>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
