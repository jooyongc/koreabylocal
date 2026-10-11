import { Card, Delta } from "../ui";
import { KpiTile } from "../cards";
import { BarList } from "../charts/BarList";
import { ShareBar } from "../charts/misc";
import { DataTable, type Column } from "../DataTable";
import { useOpenDrill } from "../context";
import { fmtDuration, fmtNum, fmtPct, partnerColor, partnerRank, ratio } from "../format";
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
      key: "name", label: "Event", value: (e) => e.eventName,
      render: (e) => (
        <span className="font-mono text-[11.5px] text-gray-800">
          {e.eventName}
          {AUTO.has(e.eventName) && <span className="ml-1.5 rounded bg-gray-100 px-1 font-sans text-[10px] text-gray-500">auto</span>}
          {e.keyEvents > 0 && <span className="ml-1.5 rounded bg-amber-50 px-1 font-sans text-[10px] font-semibold text-amber-800">key</span>}
        </span>
      ),
    },
    { key: "count", label: "Count", align: "right", value: (e) => e.eventCount, render: (e) => fmtNum(e.eventCount) },
    ...(compare ? [{ key: "delta", label: "Δ", align: "right" as const, value: (e: EventRow) => e.eventCount - (e.prev?.eventCount ?? 0), render: (e: EventRow) => <Delta cur={e.eventCount} prev={e.prev?.eventCount ?? 0} size="xs" /> }] : []),
    { key: "users", label: "Users", align: "right", value: (e) => e.totalUsers, render: (e) => fmtNum(e.totalUsers) },
    { key: "per", label: "Per user", align: "right", value: (e) => ratio(e.eventCount, e.totalUsers), render: (e) => ratio(e.eventCount, e.totalUsers).toFixed(2) },
    { key: "reach", label: "Users reached", align: "right", hint: "Users with this event ÷ all users", value: (e) => ratio(e.totalUsers, r.totals.current.activeUsers), render: (e) => fmtPct(Math.min(1, ratio(e.totalUsers, r.totals.current.activeUsers)), 1) },
  ];

  const partnerPageCols: Array<Column<PartnerPage>> = [
    { key: "page", label: "Page", value: (p) => p.title, render: (p) => <span className="block max-w-[320px] truncate font-medium text-gray-800" title={p.path}>{short(p.title)}</span> },
    { key: "views", label: "Views", align: "right", value: (p) => p.views, render: (p) => fmtNum(p.views) },
    { key: "clicks", label: "Partner clicks", align: "right", value: (p) => p.clicks, render: (p) => <span className="font-semibold text-pink-700">{fmtNum(p.clicks)}</span> },
    { key: "ctr", label: "Click-through", align: "right", hint: "Partner clicks ÷ page views", value: (p) => p.ctr, render: (p) => fmtPct(p.ctr, 1) },
    { key: "split", label: "Partners", value: (p) => Object.keys(p.partners).join(", "), render: (p) => <span className="text-gray-500">{Object.entries(p.partners).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(" · ")}</span> },
  ];

  const scrollRows = r.pages
    .filter((p) => p.screenPageViews >= 10)
    .map((p) => ({ p, rate: Math.min(1, ratio(p.scrolls, p.screenPageViews)) }))
    .sort((a, b) => b.rate - a.rate);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile i={0} label="Partner clicks" value={d.partnerClicks} format={fmtNum} prev={compare ? d.prevPartnerClicks : undefined} hint="Outbound clicks to affiliate partners" />
        <KpiTile i={1} label="Partner click-through" value={ratio(d.partnerClicks, partnerPageViews)} format={(n) => fmtPct(n, 1)} sub="On pages that carry partner links" />
        <KpiTile i={2} label="Other outbound clicks" value={d.otherOutbound.reduce((n, o) => n + o.eventCount, 0)} format={fmtNum} sub="Instagram, Airbnb, tourism sites…" />
        <KpiTile i={3} label="Forms completed" value={formSubmit} format={fmtNum} sub={formStart ? `${fmtPct(ratio(formSubmit, formStart), 0)} of ${fmtNum(formStart)} started` : "No forms started"} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="ga-rise" title="Partner clicks by programme" subtitle="Affiliate links readers clicked">
          <BarList
            empty="No partner clicks in this period."
            rows={d.partners.map((p) => ({
              key: p.name,
              label: p.name,
              text: p.domains.join(", "),
              value: p.clicks,
              display: fmtNum(p.clicks),
              sub: `${fmtNum(p.users)} users`,
              prev: compare ? p.prevClicks : undefined,
              color: "#ff2e97",
            }))}
          />
        </Card>
        <Card className="ga-rise lg:col-span-2" title="Pages that earn clicks" subtitle="Partner clicks and click-through per page">
          <DataTable
            rows={d.partnerPages}
            columns={partnerPageCols}
            defaultSort={{ key: "clicks", desc: true }}
            filename="partner-clicks-by-page"
            empty="No partner clicks in this period."
            onRowClick={(p) => openDrill({ dimension: "pagePath", value: p.path, label: p.title })}
          />
        </Card>
      </div>

      {wts && (
        <Card className="ga-rise" title="Where to Stay" subtitle="The hotel page the Instagram Reels send people to">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {[
              { label: "Views", value: fmtNum(wts.screenPageViews) },
              { label: "Users", value: fmtNum(wts.activeUsers) },
              { label: "Time / user", value: fmtDuration(ratio(wts.userEngagementDuration, wts.activeUsers)) },
              { label: "OTA clicks", value: fmtNum(wtsClicks?.clicks ?? 0) },
              { label: "Click-through", value: fmtPct(ratio(wtsClicks?.clicks ?? 0, wts.screenPageViews), 1) },
            ].map((k) => (
              <div key={k.label}>
                <p className="text-[11.5px] text-gray-500">{k.label}</p>
                <p className="mt-0.5 text-[22px] font-bold text-primary">{k.value}</p>
              </div>
            ))}
          </div>
          {wtsClicks && (
            <div className="mt-5">
              <p className="mb-2 text-[11.5px] font-medium text-gray-500">Which booking site visitors chose</p>
              <ShareBar format={fmtNum} parts={Object.entries(wtsClicks.partners).sort((a, b) => partnerRank(a[0]) - partnerRank(b[0])).map(([name, v]) => ({ label: name, value: v, color: partnerColor(name) }))} />
            </div>
          )}
          <button type="button" onClick={() => openDrill({ dimension: "pagePath", value: "/where-to-stay", label: wts.pageTitle })} className="mt-4 text-[12px] font-semibold text-primary hover:text-accent">
            Where its visitors come from →
          </button>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="ga-rise lg:col-span-2" title="Events" subtitle="Everything GA4 recorded. Mark the ones that matter as key events in GA4.">
          <DataTable
            rows={r.events}
            columns={eventCols}
            defaultSort={{ key: "count", desc: true }}
            search={(e) => e.eventName}
            filename="events"
            onRowClick={(e) => openDrill({ dimension: "eventName", value: e.eventName })}
          />
        </Card>
        <Card className="ga-rise" title="Other outbound links" subtitle="Clicks to sites that are not affiliate partners">
          <BarList
            limit={10}
            empty="No other outbound clicks."
            rows={d.otherOutbound.map((o) => ({
              key: o.linkDomain,
              label: o.linkDomain,
              value: o.eventCount,
              display: fmtNum(o.eventCount),
              sub: `${fmtNum(o.totalUsers)} users`,
              prev: compare ? o.prev?.eventCount ?? 0 : undefined,
            }))}
          />
        </Card>
      </div>

      <Card className="ga-rise" title="Read to the end" subtitle="Share of views that scrolled to 90% of the page (pages with 10+ views). Low on a long guide = people stop early.">
        <BarList
          limit={12}
          rows={scrollRows.map(({ p, rate }) => ({
            key: p.pagePath,
            label: short(p.pageTitle || p.pagePath),
            text: p.pagePath,
            value: rate,
            display: fmtPct(rate, 0),
            sub: `${fmtNum(p.screenPageViews)} views`,
            onClick: () => openDrill({ dimension: "pagePath", value: p.pagePath, label: p.pageTitle }),
          }))}
          max={1}
        />
      </Card>
    </div>
  );
}
