import { Card, Delta } from "../ui";
import { BarList } from "../charts/BarList";
import { ShareBar } from "../charts/misc";
import { DataTable, type Column } from "../DataTable";
import { useOpenDrill } from "../context";
import { SERIES, countryKo, deviceColor, deviceKo, flag, fmtDuration, fmtNum, fmtPct, ratio, userTypeKo } from "../format";
import { hint } from "../glossary";
import type { Report } from "../types";

type CountryRow = Report["countries"][number];
type CityRow = Report["cities"][number];
type DeviceRow = Report["devices"][number];

export function AudienceTab({ r }: { r: Report }) {
  const openDrill = useOpenDrill();
  const compare = Boolean(r.compare);
  const totalUsers = r.totals.current.activeUsers;
  const ko = (c: { countryId: string; country: string }) => countryKo(c.countryId, c.country);

  const countryCols: Array<Column<CountryRow>> = [
    { key: "country", label: "나라", value: ko, render: (c) => <span className="whitespace-nowrap font-medium text-gray-800" title={c.country}><span className="mr-1.5">{flag(c.countryId)}</span>{ko(c)}</span> },
    { key: "users", label: "사용자", align: "right", value: (c) => c.activeUsers, render: (c) => fmtNum(c.activeUsers) },
    ...(compare ? [{ key: "delta", label: "증감", align: "right" as const, value: (c: CountryRow) => c.activeUsers - (c.prev?.activeUsers ?? 0), render: (c: CountryRow) => <Delta cur={c.activeUsers} prev={c.prev?.activeUsers ?? 0} size="xs" /> }] : []),
    { key: "share", label: "비중", align: "right", value: (c) => ratio(c.activeUsers, totalUsers), render: (c) => fmtPct(ratio(c.activeUsers, totalUsers), 1) },
    { key: "new", label: "신규", align: "right", value: (c) => c.newUsers, render: (c) => fmtNum(c.newUsers) },
    { key: "eng", label: "참여율", align: "right", hint: hint("engagementRate"), value: (c) => ratio(c.engagedSessions, c.sessions), render: (c) => fmtPct(ratio(c.engagedSessions, c.sessions), 0) },
    { key: "engs", label: "참여 방문", align: "right", value: (c) => c.engagedSessions, render: (c) => fmtNum(c.engagedSessions) },
    { key: "time", label: "1인당 시간", align: "right", value: (c) => ratio(c.userEngagementDuration, c.activeUsers), render: (c) => fmtDuration(ratio(c.userEngagementDuration, c.activeUsers)) },
    { key: "views", label: "조회", align: "right", value: (c) => c.screenPageViews, render: (c) => fmtNum(c.screenPageViews) },
  ];

  const cityCols: Array<Column<CityRow>> = [
    { key: "city", label: "도시", value: (c) => c.city, render: (c) => <span className="font-medium text-gray-800">{c.city === "(not set)" ? <span className="text-gray-400">(알 수 없음)</span> : c.city}</span> },
    { key: "country", label: "나라", value: (c) => c.country, render: (c) => <span className="text-gray-500">{c.country}</span> },
    { key: "users", label: "사용자", align: "right", value: (c) => c.activeUsers, render: (c) => fmtNum(c.activeUsers) },
    { key: "eng", label: "참여율", align: "right", value: (c) => ratio(c.engagedSessions, c.sessions), render: (c) => fmtPct(ratio(c.engagedSessions, c.sessions), 0) },
    { key: "time", label: "1인당 시간", align: "right", value: (c) => ratio(c.userEngagementDuration, c.activeUsers), render: (c) => fmtDuration(ratio(c.userEngagementDuration, c.activeUsers)) },
  ];

  const deviceCols: Array<Column<DeviceRow>> = [
    { key: "device", label: "기기", value: (x) => deviceKo(x.deviceCategory), render: (x) => <span className="font-medium text-gray-800">{deviceKo(x.deviceCategory)}</span> },
    { key: "users", label: "사용자", align: "right", value: (x) => x.activeUsers, render: (x) => fmtNum(x.activeUsers) },
    ...(compare ? [{ key: "delta", label: "증감", align: "right" as const, value: (x: DeviceRow) => x.activeUsers - (x.prev?.activeUsers ?? 0), render: (x: DeviceRow) => <Delta cur={x.activeUsers} prev={x.prev?.activeUsers ?? 0} size="xs" /> }] : []),
    { key: "eng", label: "참여율", align: "right", value: (x) => ratio(x.engagedSessions, x.sessions), render: (x) => fmtPct(ratio(x.engagedSessions, x.sessions), 0) },
    { key: "time", label: "1인당 시간", align: "right", value: (x) => ratio(x.userEngagementDuration, x.activeUsers), render: (x) => fmtDuration(ratio(x.userEngagementDuration, x.activeUsers)) },
    { key: "vps", label: "방문당 페이지", align: "right", value: (x) => ratio(x.screenPageViews, x.sessions), render: (x) => ratio(x.screenPageViews, x.sessions).toFixed(2) },
  ];

  const engagedMarkets = [...r.countries].filter((c) => c.engagedSessions > 0).sort((a, b) => b.engagedSessions - a.engagedSessions);
  const userType = r.userType.filter((u) => u.newVsReturning === "new" || u.newVsReturning === "returning");

  const simple = (rows: Array<{ name: string; activeUsers: number; sessions: number; engagedSessions: number }>) =>
    rows.filter((x) => x.activeUsers > 0).map((x) => ({
      key: x.name,
      label: x.name === "(not set)" ? "(알 수 없음)" : x.name,
      value: x.activeUsers,
      display: `${fmtNum(x.activeUsers)}명`,
      sub: `참여 ${fmtPct(ratio(x.engagedSessions, x.sessions), 0)}`,
    }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="ga-rise" title="열심히 읽는 나라" help="방문 수가 아니라 '참여 방문'(제대로 읽은 방문) 수로 줄 세웠습니다. 봇이 많은 나라는 방문이 많아도 여기서는 낮게 나옵니다." subtitle="참여 방문 순 · 오른쪽은 그 나라 방문 중 참여 비율">
          <BarList
            limit={10}
            rows={engagedMarkets.map((c) => ({
              key: c.country,
              label: <><span className="mr-1">{flag(c.countryId)}</span>{ko(c)}</>,
              text: c.country,
              value: c.engagedSessions,
              display: `${fmtNum(c.engagedSessions)}회`,
              sub: `${fmtNum(c.sessions)}회 중 ${fmtPct(ratio(c.engagedSessions, c.sessions), 0)}`,
              onClick: () => openDrill({ dimension: "country", value: c.country, label: ko(c) }),
            }))}
          />
        </Card>
        <Card className="ga-rise lg:col-span-2" title="나라별" subtitle="행을 누르면 그 나라 사람들이 본 페이지·유입 경로·기기가 열립니다">
          <DataTable
            rows={r.countries}
            columns={countryCols}
            defaultSort={{ key: "users", desc: true }}
            search={(c) => `${ko(c)} ${c.country}`}
            filename="countries"
            pageSize={10}
            onRowClick={(c) => openDrill({ dimension: "country", value: c.country, label: ko(c) })}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="ga-rise" title="기기" subtitle="사용자 비율과 기기별 참여 정도">
          <ShareBar format={fmtNum} parts={r.devices.map((x) => ({ label: deviceKo(x.deviceCategory), value: x.activeUsers, color: deviceColor(x.deviceCategory) }))} />
          <div className="mt-5">
            <DataTable rows={r.devices} columns={deviceCols} defaultSort={{ key: "users", desc: true }} filename="devices" onRowClick={(x) => openDrill({ dimension: "deviceCategory", value: x.deviceCategory, label: deviceKo(x.deviceCategory) })} />
          </div>
        </Card>
        <Card className="ga-rise" title="처음 온 사람 vs 다시 온 사람" subtitle="다시 오는 사람은 뉴스레터·연재·인스타 팔로우로 늘릴 수 있습니다">
          <ShareBar format={fmtNum} parts={userType.map((u) => ({ label: userTypeKo(u.newVsReturning), value: u.activeUsers, color: u.newVsReturning === "new" ? SERIES[0] : SERIES[1] }))} />
          <ul className="mt-5 grid grid-cols-2 gap-3">
            {userType.map((u) => (
              <li key={u.newVsReturning}>
                <button
                  type="button"
                  onClick={() => openDrill({ dimension: "newVsReturning", value: u.newVsReturning, label: userTypeKo(u.newVsReturning) })}
                  className="w-full rounded-xl border border-gray-200 p-3 text-left hover:border-primary/30"
                >
                  <p className="text-[11.5px] font-medium text-gray-500">{userTypeKo(u.newVsReturning)}</p>
                  <p className="mt-1 text-[20px] font-bold text-primary">{fmtNum(u.activeUsers)}명</p>
                  <p className="mt-1 text-[11.5px] text-gray-500">
                    참여율 {fmtPct(ratio(u.engagedSessions, u.sessions), 0)} · 1인당 {fmtDuration(ratio(u.userEngagementDuration, u.activeUsers))} · 방문당 {ratio(u.screenPageViews, u.sessions).toFixed(1)}페이지
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="ga-rise" title="도시">
        <DataTable rows={r.cities} columns={cityCols} defaultSort={{ key: "users", desc: true }} search={(c) => `${c.city} ${c.country}`} filename="cities" pageSize={10} />
      </Card>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Card className="ga-rise" title="언어" subtitle="브라우저 언어 · 사용자 수">
          <BarList rows={simple(r.languages.map((x) => ({ name: x.language, ...x })))} />
        </Card>
        <Card className="ga-rise" title="운영체제" subtitle="사용자 수">
          <BarList rows={simple(r.os.map((x) => ({ name: x.operatingSystem, ...x })))} />
        </Card>
        <Card className="ga-rise" title="브라우저" subtitle="사용자 수">
          <BarList rows={simple(r.browsers.map((x) => ({ name: x.browser, ...x })))} />
        </Card>
      </div>

      <Card className="ga-rise" title="나이·성별">
        {r.age.length || r.gender.length ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <BarList rows={r.age.map((a) => ({ key: a.userAgeBracket, label: a.userAgeBracket, value: a.activeUsers, display: `${fmtNum(a.activeUsers)}명` }))} />
            <BarList rows={r.gender.map((g) => ({ key: g.userGender, label: g.userGender, value: g.activeUsers, display: `${fmtNum(g.activeUsers)}명` }))} />
          </div>
        ) : (
          <p className="text-[12px] text-gray-500">
            지금은 볼 수 없습니다. GA4는 'Google 신호 데이터'를 켜야 나이·성별을 보여 줍니다. 자세한 내용은 데이터 점검 탭에 있습니다.
          </p>
        )}
      </Card>
    </div>
  );
}
