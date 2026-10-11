import { useMemo, useState } from "react";
import { Card, Delta, Key, Legend, Segmented } from "../ui";
import { StackedColumns } from "../charts/StackedColumns";
import { BarList } from "../charts/BarList";
import { DataTable, type Column } from "../DataTable";
import { useOpenDrill } from "../context";
import {
  OTHER, addDaysIso, channelColor, channelKo, channelRank, fmtDay, fmtDuration, fmtNum, fmtPct, ratio, toIsoDate,
} from "../format";
import { hint } from "../glossary";
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
    // Up to eight named channels keep their own color; the rest fold into "기타".
    const named = names.filter((n) => channelColor(n) !== OTHER).slice(0, 8);
    const series = [...named, "Other"].map((name) => ({
      key: name, label: name === "Other" ? "기타" : channelKo(name), color: name === "Other" ? OTHER : channelColor(name), values: new Array(buckets.length).fill(0),
    }));
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
      key: "channel", label: "경로", value: (c) => channelKo(c.sessionDefaultChannelGroup),
      render: (c) => (
        <span className="flex items-center gap-2 font-medium text-gray-800" title={`GA4: ${c.sessionDefaultChannelGroup}`}>
          <Key color={channelColor(c.sessionDefaultChannelGroup)} shape="box" />{channelKo(c.sessionDefaultChannelGroup)}
        </span>
      ),
    },
    { key: "sessions", label: "방문", align: "right", value: (c) => c.sessions, render: (c) => fmtNum(c.sessions) },
    ...(compare ? [{ key: "delta", label: "증감", align: "right" as const, value: (c: ChannelRow) => c.sessions - (c.prev?.sessions ?? 0), render: (c: ChannelRow) => <Delta cur={c.sessions} prev={c.prev?.sessions ?? 0} size="xs" /> }] : []),
    { key: "share", label: "비중", align: "right", value: (c) => ratio(c.sessions, total), render: (c) => fmtPct(ratio(c.sessions, total), 0) },
    { key: "users", label: "사용자", align: "right", value: (c) => c.activeUsers, render: (c) => fmtNum(c.activeUsers) },
    { key: "new", label: "신규", align: "right", value: (c) => c.newUsers, render: (c) => fmtNum(c.newUsers) },
    { key: "eng", label: "참여율", align: "right", hint: hint("engagementRate"), value: (c) => ratio(c.engagedSessions, c.sessions), render: (c) => fmtPct(ratio(c.engagedSessions, c.sessions), 0) },
    { key: "time", label: "방문당 시간", align: "right", value: (c) => ratio(c.userEngagementDuration, c.sessions), render: (c) => fmtDuration(ratio(c.userEngagementDuration, c.sessions)) },
    { key: "vps", label: "방문당 페이지", align: "right", value: (c) => ratio(c.screenPageViews, c.sessions), render: (c) => ratio(c.screenPageViews, c.sessions).toFixed(2) },
    { key: "key", label: "핵심 이벤트", align: "right", hint: hint("keyEvent"), value: (c) => c.keyEvents, render: (c) => fmtNum(c.keyEvents) },
  ];

  const sourceCols: Array<Column<SourceRow>> = [
    { key: "source", label: "소스 / 매체", hint: hint("sourceMedium"), value: (s) => `${s.sessionSource} / ${s.sessionMedium}`, render: (s) => <span className="font-medium text-gray-800">{s.sessionSource} <span className="text-gray-400">/ {s.sessionMedium}</span></span> },
    { key: "sessions", label: "방문", align: "right", value: (s) => s.sessions, render: (s) => fmtNum(s.sessions) },
    ...(compare ? [{ key: "delta", label: "증감", align: "right" as const, value: (s: SourceRow) => s.sessions - (s.prev?.sessions ?? 0), render: (s: SourceRow) => <Delta cur={s.sessions} prev={s.prev?.sessions ?? 0} size="xs" /> }] : []),
    { key: "users", label: "사용자", align: "right", value: (s) => s.activeUsers, render: (s) => fmtNum(s.activeUsers) },
    { key: "eng", label: "참여율", align: "right", value: (s) => ratio(s.engagedSessions, s.sessions), render: (s) => fmtPct(ratio(s.engagedSessions, s.sessions), 0) },
    { key: "time", label: "방문당 시간", align: "right", value: (s) => ratio(s.userEngagementDuration, s.sessions), render: (s) => fmtDuration(ratio(s.userEngagementDuration, s.sessions)) },
    { key: "views", label: "조회", align: "right", value: (s) => s.screenPageViews, render: (s) => fmtNum(s.screenPageViews) },
    { key: "key", label: "핵심 이벤트", align: "right", value: (s) => s.keyEvents, render: (s) => fmtNum(s.keyEvents) },
  ];

  const campaignCols: Array<Column<CampaignRow>> = [
    { key: "campaign", label: "캠페인 이름 (utm_campaign)", hint: hint("campaign"), value: (c) => c.sessionCampaignName, render: (c) => <span className="font-medium text-gray-800">{c.sessionCampaignName}</span> },
    { key: "sm", label: "소스 / 매체", value: (c) => `${c.sessionSource} / ${c.sessionMedium}`, render: (c) => <span className="text-gray-500">{c.sessionSource} / {c.sessionMedium}</span> },
    { key: "sessions", label: "방문", align: "right", value: (c) => c.sessions, render: (c) => fmtNum(c.sessions) },
    { key: "new", label: "신규", align: "right", value: (c) => c.newUsers, render: (c) => fmtNum(c.newUsers) },
    { key: "eng", label: "참여율", align: "right", value: (c) => ratio(c.engagedSessions, c.sessions), render: (c) => fmtPct(ratio(c.engagedSessions, c.sessions), 0) },
    { key: "time", label: "방문당 시간", align: "right", value: (c) => ratio(c.userEngagementDuration, c.sessions), render: (c) => fmtDuration(ratio(c.userEngagementDuration, c.sessions)) },
    { key: "key", label: "핵심 이벤트", align: "right", value: (c) => c.keyEvents, render: (c) => fmtNum(c.keyEvents) },
  ];

  const social = r.sources.filter((s) => /social|referral/i.test(s.sessionMedium) || /instagram|facebook|youtube|tiktok|pinterest|reddit|x\.com|t\.co|threads|naver|blog/i.test(s.sessionSource));

  return (
    <div className="space-y-5">
      <Card
        className="ga-rise"
        title={`${stack.weekly ? "주별" : "날짜별"} ${metric === "sessions" ? "방문" : "참여 방문"} — 경로별로 쌓기`}
        help="막대 하나가 하루(또는 한 주)이고, 색깔별로 어느 경로로 왔는지 나뉩니다. 막대에 마우스를 올리면 경로별 숫자가 나옵니다. '참여'로 바꾸면 실제로 읽은 방문만 봅니다."
        subtitle="어떤 경로가 언제 늘고 줄었는지"
        actions={<Segmented size="sm" value={metric} onChange={setMetric} options={[{ value: "sessions", label: "전체 방문" }, { value: "engagedSessions", label: "참여 방문" }]} />}
      >
        <div className="mb-3"><Legend items={stack.series.map((s) => ({ label: s.label, color: s.color }))} /></div>
        <StackedColumns
          ariaLabel="경로별 방문 추이"
          labels={stack.buckets}
          series={stack.series}
          format={(n) => `${fmtNum(n)}회`}
          labelOf={(l) => (stack.weekly ? `${fmtDay(l)} 주` : fmtDay(l))}
          height={260}
        />
      </Card>

      <Card className="ga-rise" title="유입 경로별 성과" help={hint("channel")} subtitle="행을 누르면 그 경로로 온 사람들이 본 페이지·나라·기기가 열립니다">
        <DataTable
          rows={r.channels}
          columns={channelCols}
          defaultSort={{ key: "sessions", desc: true }}
          filename="channels"
          onRowClick={(c) => openDrill({ dimension: "sessionDefaultChannelGroup", value: c.sessionDefaultChannelGroup, label: channelKo(c.sessionDefaultChannelGroup) })}
        />
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="ga-rise lg:col-span-2" title="소스 / 매체 (자세한 출처)" help={hint("sourceMedium")} subtitle="google / organic = 구글 검색, instagram / social = 인스타그램, (direct) / (none) = 직접 방문">
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
          <Card className="ga-rise" title="새로 온 사람은 처음에 어디서?" subtitle="처음 방문했을 때의 경로 · 신규 사용자 수">
            <BarList
              rows={r.firstUser.filter((f) => f.newUsers > 0).map((f) => ({
                key: f.firstUserDefaultChannelGroup,
                label: channelKo(f.firstUserDefaultChannelGroup),
                text: `GA4: ${f.firstUserDefaultChannelGroup}`,
                value: f.newUsers,
                display: `${fmtNum(f.newUsers)}명`,
                color: channelColor(f.firstUserDefaultChannelGroup),
              }))}
            />
          </Card>
          <Card className="ga-rise" title="인스타그램" subtitle="instagram, l.instagram.com 등 인스타에서 온 방문">
            <div className="flex items-baseline gap-2">
              <span className="text-[28px] font-bold leading-none text-primary">{fmtNum(d.instagram.sessions)}</span>
              <span className="text-[12px] text-gray-500">회 방문</span>
              {compare && <Delta cur={d.instagram.sessions} prev={d.instagram.prev} />}
            </div>
            <p className="mt-1 text-[12px] text-gray-500">참여율 {fmtPct(ratio(d.instagram.engaged, d.instagram.sessions), 0)} · 사이트 평균 {fmtPct(d.engagementRate, 0)}</p>
            <div className="mt-4">
              <BarList
                empty="인스타그램에서 온 방문이 없습니다."
                rows={d.instagram.sources.map((s) => ({
                  key: `${s.sessionSource}/${s.sessionMedium}`,
                  label: `${s.sessionSource} / ${s.sessionMedium}`,
                  value: s.sessions,
                  display: `${fmtNum(s.sessions)}회`,
                  sub: `참여 ${fmtPct(ratio(s.engagedSessions, s.sessions), 0)}`,
                  onClick: () => openDrill({ dimension: "sessionSourceMedium", value: `${s.sessionSource} / ${s.sessionMedium}` }),
                }))}
              />
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="ga-rise" title="캠페인 (UTM 꼬리표)" help={hint("campaign")} subtitle="링크에 utm_campaign을 붙여 둔 방문 — 인스타 프로필 링크, 뉴스레터 등">
          <DataTable
            rows={r.campaigns}
            columns={campaignCols}
            defaultSort={{ key: "sessions", desc: true }}
            filename="campaigns"
            empty="이 기간에는 꼬리표가 붙은 방문이 없습니다."
            onRowClick={(c) => openDrill({ dimension: "sessionCampaignName", value: c.sessionCampaignName })}
          />
        </Card>
        <Card className="ga-rise" title="SNS·다른 사이트" subtitle="링크를 걸어 사람을 보내 준 사이트와 앱">
          <BarList
            limit={10}
            empty="SNS나 다른 사이트에서 온 방문이 없습니다."
            rows={social.map((s) => ({
              key: `${s.sessionSource}/${s.sessionMedium}`,
              label: `${s.sessionSource} / ${s.sessionMedium}`,
              value: s.sessions,
              display: `${fmtNum(s.sessions)}회`,
              sub: `참여 ${fmtPct(ratio(s.engagedSessions, s.sessions), 0)}`,
              prev: compare ? s.prev?.sessions ?? 0 : undefined,
              onClick: () => openDrill({ dimension: "sessionSourceMedium", value: `${s.sessionSource} / ${s.sessionMedium}` }),
            }))}
          />
        </Card>
      </div>
    </div>
  );
}
