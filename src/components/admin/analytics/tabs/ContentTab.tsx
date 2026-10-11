import { useMemo, useState } from "react";
import { Card, Delta, Segmented } from "../ui";
import { BarList } from "../charts/BarList";
import { Scatter } from "../charts/Scatter";
import { DataTable, type Column } from "../DataTable";
import { useOpenDrill } from "../context";
import {
  BAD, GOOD, fmtCompact, fmtDuration, fmtNum, fmtPct, isBrokenTitle, ratio, sectionOf,
} from "../format";
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

  const sectionCols: Array<Column<SectionTotal>> = [
    { key: "label", label: "Section", value: (s) => s.label, render: (s) => <span className="font-medium text-gray-800">{s.label}</span> },
    { key: "pages", label: "Pages", align: "right", value: (s) => s.pages, render: (s) => fmtNum(s.pages) },
    { key: "views", label: "Views", align: "right", value: (s) => s.views, render: (s) => fmtNum(s.views) },
    ...(compare ? [{ key: "delta", label: "Δ", align: "right" as const, value: (s: SectionTotal) => s.views - s.prevViews, render: (s: SectionTotal) => <Delta cur={s.views} prev={s.prevViews} size="xs" /> }] : []),
    { key: "share", label: "Share", align: "right", value: (s) => ratio(s.views, r.totals.current.screenPageViews), render: (s) => fmtPct(ratio(s.views, r.totals.current.screenPageViews), 0) },
    { key: "time", label: "Time / view", align: "right", hint: "Engagement time ÷ views", value: (s) => ratio(s.engagement, s.views), render: (s) => fmtDuration(ratio(s.engagement, s.views)) },
  ];

  const pageCols: Array<Column<PageRow>> = [
    {
      key: "title", label: "Page", value: (p) => p.pageTitle || p.pagePath,
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
    { key: "section", label: "Section", value: (p) => sectionOf(p.pagePath), render: (p) => <span className="whitespace-nowrap text-gray-500">{sectionOf(p.pagePath)}</span> },
    { key: "views", label: "Views", align: "right", value: (p) => p.screenPageViews, render: (p) => fmtNum(p.screenPageViews) },
    ...(compare ? [{ key: "delta", label: "Δ", align: "right" as const, value: (p: PageRow) => p.screenPageViews - p.prevViews, render: (p: PageRow) => <Delta cur={p.screenPageViews} prev={p.prevViews} size="xs" /> }] : []),
    { key: "users", label: "Users", align: "right", value: (p) => p.activeUsers, render: (p) => fmtNum(p.activeUsers) },
    { key: "entr", label: "Entrances", align: "right", hint: "Sessions that started on this page", value: (p) => entrances.get(p.pagePath.replace(/\/$/, "") || "/") ?? 0, render: (p) => fmtNum(entrances.get(p.pagePath.replace(/\/$/, "") || "/") ?? 0) },
    { key: "time", label: "Time / user", align: "right", value: perUser, render: (p) => fmtDuration(perUser(p)) },
    { key: "scroll", label: "Read to end", align: "right", hint: "Scroll events (90% depth) ÷ views", value: (p) => Math.min(1, ratio(p.scrolls, p.screenPageViews)), render: (p) => fmtPct(Math.min(1, ratio(p.scrolls, p.screenPageViews)), 0) },
    { key: "partner", label: "Partner clicks", align: "right", value: (p) => partnerClicks.get(p.pagePath) ?? 0, render: (p) => { const n = partnerClicks.get(p.pagePath) ?? 0; return n ? <span className="font-semibold text-pink-700">{fmtNum(n)}</span> : <span className="text-gray-300">0</span>; } },
  ];

  const landingCols: Array<Column<LandingRow>> = [
    { key: "page", label: "Landing page", value: (l) => l.landingPage, render: (l) => <span className="block max-w-[320px] truncate font-mono text-[11.5px] text-gray-800" title={l.landingPage}>{l.landingPage}</span> },
    { key: "sessions", label: "Sessions", align: "right", value: (l) => l.sessions, render: (l) => fmtNum(l.sessions) },
    ...(compare ? [{ key: "delta", label: "Δ", align: "right" as const, value: (l: LandingRow) => l.sessions - (l.prev?.sessions ?? 0), render: (l: LandingRow) => <Delta cur={l.sessions} prev={l.prev?.sessions ?? 0} size="xs" /> }] : []),
    { key: "eng", label: "Engaged", align: "right", value: (l) => ratio(l.engagedSessions, l.sessions), render: (l) => { const v = ratio(l.engagedSessions, l.sessions); return <span style={{ color: v >= d.engagementRate * 1.25 ? GOOD : v < d.engagementRate * 0.5 ? BAD : undefined }}>{fmtPct(v, 0)}</span>; } },
    { key: "new", label: "New users", align: "right", value: (l) => ratio(l.newUsers, l.activeUsers), render: (l) => fmtPct(ratio(l.newUsers, l.activeUsers), 0) },
    { key: "time", label: "Time / session", align: "right", value: (l) => ratio(l.userEngagementDuration, l.sessions), render: (l) => fmtDuration(ratio(l.userEngagementDuration, l.sessions)) },
    { key: "vps", label: "Views / session", align: "right", value: (l) => ratio(l.screenPageViews, l.sessions), render: (l) => ratio(l.screenPageViews, l.sessions).toFixed(2) },
    { key: "key", label: "Key events", align: "right", value: (l) => l.keyEvents, render: (l) => fmtNum(l.keyEvents) },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <Card className="ga-rise xl:col-span-2" title="Sections" subtitle="Views and reading time by part of the site">
          <BarList
            limit={10}
            rows={d.sections.map((s) => ({
              key: s.label,
              label: s.label,
              value: s.views,
              display: fmtNum(s.views),
              sub: `${fmtDuration(ratio(s.engagement, s.views))}/view`,
              prev: compare ? s.prevViews : undefined,
            }))}
          />
          <div className="mt-5 border-t border-gray-100 pt-4">
            <DataTable rows={d.sections} columns={sectionCols} defaultSort={{ key: "views", desc: true }} filename="sections" pageSize={10} />
          </div>
        </Card>
        <Card
          className="ga-rise xl:col-span-3"
          title="Content opportunity map"
          subtitle="Each dot is a page (3+ views). Up = read longer, right = seen more. Lines are the medians."
        >
          <Scatter
            points={points}
            xLabel="views"
            yLabel="engagement time per user"
            xFormat={fmtCompact}
            yFormat={fmtDuration}
            height={360}
            quadrants={{ topLeft: "Hidden gems — promote", topRight: "Stars — keep fresh", bottomLeft: "Low priority", bottomRight: "Leaky — improve" }}
          />
        </Card>
      </div>

      {movers.length > 0 && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card className="ga-rise" title="Rising pages" subtitle="Most views gained vs the comparison period">
            <BarList
              empty="No page gained views."
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
          <Card className="ga-rise" title="Falling pages" subtitle="Most views lost vs the comparison period">
            <BarList
              empty="No page lost views."
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
        title="All pages"
        subtitle="Admin pages are left out. Click a page for its traffic sources, countries and outbound clicks."
      >
        <DataTable
          rows={pages}
          columns={pageCols}
          defaultSort={{ key: "views", desc: true }}
          search={(p) => `${p.pageTitle} ${p.pagePath}`}
          filename="pages"
          pageSize={15}
          toolbar={<Segmented size="sm" value={hideBroken} onChange={setHideBroken} options={[{ value: "live", label: "Live pages" }, { value: "all", label: "Include 404s" }]} />}
          onRowClick={(p) => openDrill({ dimension: "pagePath", value: p.pagePath, label: p.pageTitle })}
        />
      </Card>

      <Card className="ga-rise" title="Landing pages" subtitle="Where sessions start — the page that has to hook a visitor. Green/red = well above/below the site's engagement rate.">
        <DataTable
          rows={r.landing}
          columns={landingCols}
          defaultSort={{ key: "sessions", desc: true }}
          search={(l) => l.landingPage}
          filename="landing-pages"
          onRowClick={(l) => l.landingPage !== "(not set)" && openDrill({ dimension: "landingPage", value: l.landingPage })}
        />
      </Card>

      <Card className="ga-rise" title="Site search" subtitle="What visitors typed into search — content they want">
        <BarList
          empty={d.junkSearch ? "Only encoded legacy URLs so far — no real searches in this period." : "No site searches in this period."}
          rows={d.realSearch.map((s) => ({
            key: s.searchTerm,
            label: `"${s.searchTerm}"`,
            value: s.eventCount,
            display: fmtNum(s.eventCount),
            sub: `${fmtNum(s.totalUsers)} users`,
          }))}
        />
      </Card>
    </div>
  );
}
