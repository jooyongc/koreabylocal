import { useMemo, useState } from "react";
import { Card, Delta, Key, Legend, Segmented } from "../ui";
import { StackedColumns } from "../charts/StackedColumns";
import { BarList } from "../charts/BarList";
import { DataTable, type Column } from "../DataTable";
import { useOpenDrill } from "../context";
import {
  OTHER, addDaysIso, channelColor, channelRank, fmtDay, fmtDuration, fmtNum, fmtPct, ratio, toIsoDate,
} from "../format";
import type { Derived } from "../derive";
import type { Report } from "../types";

type ChannelRow = Report["channels"][number];
type SourceRow = Report["sources"][number];
type CampaignRow = Report["campaigns"][number];

export function AcquisitionTab({ r, d }: { r: Report; d: Derived }) {
  const openDrill = useOpenDrill();
  const [metric, setMetric] = useState<"sessions" | "engagedSessions">("sessions");
  const compare = Boolean(r.compare);
  const total = r.totals.current.sessions;

  // Days, or weeks once the range is long enough that daily columns turn to hairlines.
  const stack = useMemo(() => {
    const weekly = r.range.days > 92;
    const bucketOf = (iso: string) => {
      if (!weekly) return iso;
      const offset = Math.floor((Date.parse(iso) - Date.parse(r.range.startDate)) / (7 * 864e5));
      return addDaysIso(r.range.startDate, offset * 7);
    };
    const buckets: string[] = [];
    for (let day = r.range.startDate; day <= r.range.endDate; day = addDaysIso(day, 1)) {
      const b = bucketOf(day);
      if (buckets[buckets.length - 1] !== b) buckets.push(b);
    }
    const index = new Map(buckets.map((b, i) => [b, i]));
    const names = [...new Set(r.channelDaily.map((c) => c.sessionDefaultChannelGroup))]
      .sort((a, b) => channelRank(a) - channelRank(b));
    // Up to eight named channels keep their own color; the rest fold into "Other".
    const named = names.filter((n) => channelColor(n) !== OTHER).slice(0, 8);
    const series = [...named, "Other"].map((name) => ({ key: name, label: name, color: name === "Other" ? OTHER : channelColor(name), values: new Array(buckets.length).fill(0) }));
    for (const row of r.channelDaily) {
      const i = index.get(bucketOf(toIsoDate(row.date)));
      if (i == null) continue;
      const s = series.find((x) => x.key === row.sessionDefaultChannelGroup) ?? series[series.length - 1];
      s.values[i] += row[metric];
    }
    return { buckets, weekly, series: series.filter((s) => s.values.some((v) => v > 0)) };
  }, [r, metric]);

  const channelCols: Array<Column<ChannelRow>> = [
    {
      key: "channel", label: "Channel", value: (c) => c.sessionDefaultChannelGroup,
      render: (c) => <span className="flex items-center gap-2 font-medium text-gray-800"><Key color={channelColor(c.sessionDefaultChannelGroup)} shape="box" />{c.sessionDefaultChannelGroup}</span>,
    },
    { key: "sessions", label: "Sessions", align: "right", value: (c) => c.sessions, render: (c) => fmtNum(c.sessions) },
    ...(compare ? [{ key: "delta", label: "Δ", align: "right" as const, value: (c: ChannelRow) => c.sessions - (c.prev?.sessions ?? 0), render: (c: ChannelRow) => <Delta cur={c.sessions} prev={c.prev?.sessions ?? 0} size="xs" /> }] : []),
    { key: "share", label: "Share", align: "right", value: (c) => ratio(c.sessions, total), render: (c) => fmtPct(ratio(c.sessions, total), 0) },
    { key: "users", label: "Users", align: "right", value: (c) => c.activeUsers, render: (c) => fmtNum(c.activeUsers) },
    { key: "new", label: "New users", align: "right", value: (c) => c.newUsers, render: (c) => fmtNum(c.newUsers) },
    { key: "eng", label: "Engaged", align: "right", hint: "Engaged sessions ÷ sessions", value: (c) => ratio(c.engagedSessions, c.sessions), render: (c) => fmtPct(ratio(c.engagedSessions, c.sessions), 0) },
    { key: "time", label: "Time / session", align: "right", value: (c) => ratio(c.userEngagementDuration, c.sessions), render: (c) => fmtDuration(ratio(c.userEngagementDuration, c.sessions)) },
    { key: "vps", label: "Views / session", align: "right", value: (c) => ratio(c.screenPageViews, c.sessions), render: (c) => ratio(c.screenPageViews, c.sessions).toFixed(2) },
    { key: "key", label: "Key events", align: "right", value: (c) => c.keyEvents, render: (c) => fmtNum(c.keyEvents) },
  ];

  const sourceCols: Array<Column<SourceRow>> = [
    { key: "source", label: "Source / medium", value: (s) => `${s.sessionSource} / ${s.sessionMedium}`, render: (s) => <span className="font-medium text-gray-800">{s.sessionSource} <span className="text-gray-400">/ {s.sessionMedium}</span></span> },
    { key: "sessions", label: "Sessions", align: "right", value: (s) => s.sessions, render: (s) => fmtNum(s.sessions) },
    ...(compare ? [{ key: "delta", label: "Δ", align: "right" as const, value: (s: SourceRow) => s.sessions - (s.prev?.sessions ?? 0), render: (s: SourceRow) => <Delta cur={s.sessions} prev={s.prev?.sessions ?? 0} size="xs" /> }] : []),
    { key: "users", label: "Users", align: "right", value: (s) => s.activeUsers, render: (s) => fmtNum(s.activeUsers) },
    { key: "eng", label: "Engaged", align: "right", value: (s) => ratio(s.engagedSessions, s.sessions), render: (s) => fmtPct(ratio(s.engagedSessions, s.sessions), 0) },
    { key: "time", label: "Time / session", align: "right", value: (s) => ratio(s.userEngagementDuration, s.sessions), render: (s) => fmtDuration(ratio(s.userEngagementDuration, s.sessions)) },
    { key: "views", label: "Views", align: "right", value: (s) => s.screenPageViews, render: (s) => fmtNum(s.screenPageViews) },
    { key: "key", label: "Key events", align: "right", value: (s) => s.keyEvents, render: (s) => fmtNum(s.keyEvents) },
  ];

  const campaignCols: Array<Column<CampaignRow>> = [
    { key: "campaign", label: "Campaign (utm_campaign)", value: (c) => c.sessionCampaignName, render: (c) => <span className="font-medium text-gray-800">{c.sessionCampaignName}</span> },
    { key: "sm", label: "Source / medium", value: (c) => `${c.sessionSource} / ${c.sessionMedium}`, render: (c) => <span className="text-gray-500">{c.sessionSource} / {c.sessionMedium}</span> },
    { key: "sessions", label: "Sessions", align: "right", value: (c) => c.sessions, render: (c) => fmtNum(c.sessions) },
    { key: "new", label: "New users", align: "right", value: (c) => c.newUsers, render: (c) => fmtNum(c.newUsers) },
    { key: "eng", label: "Engaged", align: "right", value: (c) => ratio(c.engagedSessions, c.sessions), render: (c) => fmtPct(ratio(c.engagedSessions, c.sessions), 0) },
    { key: "time", label: "Time / session", align: "right", value: (c) => ratio(c.userEngagementDuration, c.sessions), render: (c) => fmtDuration(ratio(c.userEngagementDuration, c.sessions)) },
    { key: "key", label: "Key events", align: "right", value: (c) => c.keyEvents, render: (c) => fmtNum(c.keyEvents) },
  ];

  const social = r.sources.filter((s) => /social|referral/i.test(s.sessionMedium) || /instagram|facebook|youtube|tiktok|pinterest|reddit|x\.com|t\.co|threads|naver|blog/i.test(s.sessionSource));

  return (
    <div className="space-y-5">
      <Card
        className="ga-rise"
        title={`${metric === "sessions" ? "Sessions" : "Engaged sessions"} by channel, per ${stack.weekly ? "week" : "day"}`}
        subtitle="Stacked by channel — hover a column for the split"
        actions={<Segmented size="sm" value={metric} onChange={setMetric} options={[{ value: "sessions", label: "Sessions" }, { value: "engagedSessions", label: "Engaged" }]} />}
      >
        <div className="mb-3"><Legend items={stack.series.map((s) => ({ label: s.label, color: s.color }))} /></div>
        <StackedColumns
          ariaLabel="Sessions by channel over time"
          labels={stack.buckets}
          series={stack.series}
          format={fmtNum}
          labelOf={(l) => (stack.weekly ? `wk ${fmtDay(l)}` : fmtDay(l))}
          height={260}
        />
      </Card>

      <Card className="ga-rise" title="Channels" subtitle="Click a channel for its pages, sources and countries">
        <DataTable
          rows={r.channels}
          columns={channelCols}
          defaultSort={{ key: "sessions", desc: true }}
          filename="channels"
          onRowClick={(c) => openDrill({ dimension: "sessionDefaultChannelGroup", value: c.sessionDefaultChannelGroup })}
        />
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="ga-rise lg:col-span-2" title="Source / medium" subtitle="Where each session came from">
          <DataTable
            rows={r.sources}
            columns={sourceCols}
            defaultSort={{ key: "sessions", desc: true }}
            search={(s) => `${s.sessionSource} ${s.sessionMedium}`}
            filename="sources"
            onRowClick={(s) => openDrill({ dimension: "sessionSourceMedium", value: `${s.sessionSource} / ${s.sessionMedium}` })}
          />
        </Card>
        <div className="space-y-5">
          <Card className="ga-rise" title="Where new users first came from" subtitle="First-visit channel">
            <BarList
              rows={r.firstUser.filter((f) => f.newUsers > 0).map((f) => ({
                key: f.firstUserDefaultChannelGroup,
                label: f.firstUserDefaultChannelGroup,
                value: f.newUsers,
                display: fmtNum(f.newUsers),
                color: channelColor(f.firstUserDefaultChannelGroup),
              }))}
            />
          </Card>
          <Card className="ga-rise" title="Instagram" subtitle="instagram, l.instagram.com and other IG sources">
            <div className="flex items-baseline gap-2">
              <span className="text-[28px] font-bold leading-none text-primary">{fmtNum(d.instagram.sessions)}</span>
              <span className="text-[12px] text-gray-500">sessions</span>
              {compare && <Delta cur={d.instagram.sessions} prev={d.instagram.prev} />}
            </div>
            <p className="mt-1 text-[12px] text-gray-500">{fmtPct(ratio(d.instagram.engaged, d.instagram.sessions), 0)} engaged · site average {fmtPct(d.engagementRate, 0)}</p>
            <div className="mt-4">
              <BarList
                empty="No Instagram sessions."
                rows={d.instagram.sources.map((s) => ({
                  key: `${s.sessionSource}/${s.sessionMedium}`,
                  label: `${s.sessionSource} / ${s.sessionMedium}`,
                  value: s.sessions,
                  display: fmtNum(s.sessions),
                  sub: `${fmtPct(ratio(s.engagedSessions, s.sessions), 0)} eng.`,
                  onClick: () => openDrill({ dimension: "sessionSourceMedium", value: `${s.sessionSource} / ${s.sessionMedium}` }),
                }))}
              />
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="ga-rise" title="Campaigns (UTM)" subtitle="Links tagged with utm_campaign — profile links, newsletters, partner posts">
          <DataTable
            rows={r.campaigns}
            columns={campaignCols}
            defaultSort={{ key: "sessions", desc: true }}
            filename="campaigns"
            empty="No tagged campaigns in this period."
            onRowClick={(c) => openDrill({ dimension: "sessionCampaignName", value: c.sessionCampaignName })}
          />
        </Card>
        <Card className="ga-rise" title="Social & referral sites" subtitle="Sites and apps that link to you">
          <BarList
            limit={10}
            empty="No social or referral traffic."
            rows={social.map((s) => ({
              key: `${s.sessionSource}/${s.sessionMedium}`,
              label: `${s.sessionSource} / ${s.sessionMedium}`,
              value: s.sessions,
              display: fmtNum(s.sessions),
              sub: `${fmtPct(ratio(s.engagedSessions, s.sessions), 0)} eng.`,
              prev: compare ? s.prev?.sessions ?? 0 : undefined,
              onClick: () => openDrill({ dimension: "sessionSourceMedium", value: `${s.sessionSource} / ${s.sessionMedium}` }),
            }))}
          />
        </Card>
      </div>
    </div>
  );
}
