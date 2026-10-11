import { Card, Delta } from "../ui";
import { BarList } from "../charts/BarList";
import { ShareBar } from "../charts/misc";
import { DataTable, type Column } from "../DataTable";
import { useOpenDrill } from "../context";
import { SERIES, deviceColor, flag, fmtDuration, fmtNum, fmtPct, ratio } from "../format";
import type { Report } from "../types";

type CountryRow = Report["countries"][number];
type CityRow = Report["cities"][number];
type DeviceRow = Report["devices"][number];

export function AudienceTab({ r }: { r: Report }) {
  const openDrill = useOpenDrill();
  const compare = Boolean(r.compare);
  const totalUsers = r.totals.current.activeUsers;

  const countryCols: Array<Column<CountryRow>> = [
    { key: "country", label: "Country", value: (c) => c.country, render: (c) => <span className="whitespace-nowrap font-medium text-gray-800"><span className="mr-1.5">{flag(c.countryId)}</span>{c.country}</span> },
    { key: "users", label: "Users", align: "right", value: (c) => c.activeUsers, render: (c) => fmtNum(c.activeUsers) },
    ...(compare ? [{ key: "delta", label: "Δ", align: "right" as const, value: (c: CountryRow) => c.activeUsers - (c.prev?.activeUsers ?? 0), render: (c: CountryRow) => <Delta cur={c.activeUsers} prev={c.prev?.activeUsers ?? 0} size="xs" /> }] : []),
    { key: "share", label: "Share", align: "right", value: (c) => ratio(c.activeUsers, totalUsers), render: (c) => fmtPct(ratio(c.activeUsers, totalUsers), 1) },
    { key: "new", label: "New users", align: "right", value: (c) => c.newUsers, render: (c) => fmtNum(c.newUsers) },
    { key: "eng", label: "Engaged", align: "right", value: (c) => ratio(c.engagedSessions, c.sessions), render: (c) => fmtPct(ratio(c.engagedSessions, c.sessions), 0) },
    { key: "engs", label: "Engaged sessions", align: "right", value: (c) => c.engagedSessions, render: (c) => fmtNum(c.engagedSessions) },
    { key: "time", label: "Time / user", align: "right", value: (c) => ratio(c.userEngagementDuration, c.activeUsers), render: (c) => fmtDuration(ratio(c.userEngagementDuration, c.activeUsers)) },
    { key: "views", label: "Views", align: "right", value: (c) => c.screenPageViews, render: (c) => fmtNum(c.screenPageViews) },
  ];

  const cityCols: Array<Column<CityRow>> = [
    { key: "city", label: "City", value: (c) => c.city, render: (c) => <span className="font-medium text-gray-800">{c.city === "(not set)" ? <span className="text-gray-400">(unknown)</span> : c.city}</span> },
    { key: "country", label: "Country", value: (c) => c.country, render: (c) => <span className="text-gray-500">{c.country}</span> },
    { key: "users", label: "Users", align: "right", value: (c) => c.activeUsers, render: (c) => fmtNum(c.activeUsers) },
    { key: "eng", label: "Engaged", align: "right", value: (c) => ratio(c.engagedSessions, c.sessions), render: (c) => fmtPct(ratio(c.engagedSessions, c.sessions), 0) },
    { key: "time", label: "Time / user", align: "right", value: (c) => ratio(c.userEngagementDuration, c.activeUsers), render: (c) => fmtDuration(ratio(c.userEngagementDuration, c.activeUsers)) },
  ];

  const deviceCols: Array<Column<DeviceRow>> = [
    { key: "device", label: "Device", value: (x) => x.deviceCategory, render: (x) => <span className="font-medium capitalize text-gray-800">{x.deviceCategory}</span> },
    { key: "users", label: "Users", align: "right", value: (x) => x.activeUsers, render: (x) => fmtNum(x.activeUsers) },
    ...(compare ? [{ key: "delta", label: "Δ", align: "right" as const, value: (x: DeviceRow) => x.activeUsers - (x.prev?.activeUsers ?? 0), render: (x: DeviceRow) => <Delta cur={x.activeUsers} prev={x.prev?.activeUsers ?? 0} size="xs" /> }] : []),
    { key: "eng", label: "Engaged", align: "right", value: (x) => ratio(x.engagedSessions, x.sessions), render: (x) => fmtPct(ratio(x.engagedSessions, x.sessions), 0) },
    { key: "time", label: "Time / user", align: "right", value: (x) => ratio(x.userEngagementDuration, x.activeUsers), render: (x) => fmtDuration(ratio(x.userEngagementDuration, x.activeUsers)) },
    { key: "vps", label: "Views / session", align: "right", value: (x) => ratio(x.screenPageViews, x.sessions), render: (x) => ratio(x.screenPageViews, x.sessions).toFixed(2) },
  ];

  const engagedMarkets = [...r.countries].filter((c) => c.engagedSessions > 0).sort((a, b) => b.engagedSessions - a.engagedSessions);
  const userType = r.userType.filter((u) => u.newVsReturning === "new" || u.newVsReturning === "returning");

  const simple = (rows: Array<{ name: string; activeUsers: number; sessions: number; engagedSessions: number }>) =>
    rows.filter((x) => x.activeUsers > 0).map((x) => ({
      key: x.name,
      label: x.name,
      value: x.activeUsers,
      display: fmtNum(x.activeUsers),
      sub: `${fmtPct(ratio(x.engagedSessions, x.sessions), 0)} eng.`,
    }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="ga-rise" title="Most engaged markets" subtitle="Ranked by engaged sessions, not raw visits">
          <BarList
            limit={10}
            rows={engagedMarkets.map((c) => ({
              key: c.country,
              label: <><span className="mr-1">{flag(c.countryId)}</span>{c.country}</>,
              text: c.country,
              value: c.engagedSessions,
              display: fmtNum(c.engagedSessions),
              sub: `${fmtPct(ratio(c.engagedSessions, c.sessions), 0)} of ${fmtNum(c.sessions)}`,
              onClick: () => openDrill({ dimension: "country", value: c.country }),
            }))}
          />
        </Card>
        <Card className="ga-rise lg:col-span-2" title="Countries" subtitle="Click a country for its pages, sources and devices">
          <DataTable
            rows={r.countries}
            columns={countryCols}
            defaultSort={{ key: "users", desc: true }}
            search={(c) => c.country}
            filename="countries"
            pageSize={10}
            onRowClick={(c) => openDrill({ dimension: "country", value: c.country })}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="ga-rise" title="Devices" subtitle="Share of users, and how each device engages">
          <ShareBar format={fmtNum} parts={r.devices.map((x) => ({ label: x.deviceCategory, value: x.activeUsers, color: deviceColor(x.deviceCategory) }))} />
          <div className="mt-5">
            <DataTable rows={r.devices} columns={deviceCols} defaultSort={{ key: "users", desc: true }} filename="devices" onRowClick={(x) => openDrill({ dimension: "deviceCategory", value: x.deviceCategory })} />
          </div>
        </Card>
        <Card className="ga-rise" title="New vs returning" subtitle="Returning visitors are the ones a newsletter or series brings back">
          <ShareBar format={fmtNum} parts={userType.map((u) => ({ label: u.newVsReturning, value: u.activeUsers, color: u.newVsReturning === "new" ? SERIES[0] : SERIES[1] }))} />
          <ul className="mt-5 grid grid-cols-2 gap-3">
            {userType.map((u) => (
              <li key={u.newVsReturning}>
                <button
                  type="button"
                  onClick={() => openDrill({ dimension: "newVsReturning", value: u.newVsReturning })}
                  className="w-full rounded-xl border border-gray-200 p-3 text-left hover:border-primary/30"
                >
                  <p className="text-[11.5px] font-medium capitalize text-gray-500">{u.newVsReturning}</p>
                  <p className="mt-1 text-[20px] font-bold text-primary">{fmtNum(u.activeUsers)}</p>
                  <p className="mt-1 text-[11.5px] text-gray-500">
                    {fmtPct(ratio(u.engagedSessions, u.sessions), 0)} engaged · {fmtDuration(ratio(u.userEngagementDuration, u.activeUsers))}/user · {ratio(u.screenPageViews, u.sessions).toFixed(1)} views/session
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="ga-rise" title="Cities">
        <DataTable rows={r.cities} columns={cityCols} defaultSort={{ key: "users", desc: true }} search={(c) => `${c.city} ${c.country}`} filename="cities" pageSize={10} />
      </Card>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Card className="ga-rise" title="Language" subtitle="Browser language · users">
          <BarList rows={simple(r.languages.map((x) => ({ name: x.language, ...x })))} />
        </Card>
        <Card className="ga-rise" title="Operating system" subtitle="Users">
          <BarList rows={simple(r.os.map((x) => ({ name: x.operatingSystem, ...x })))} />
        </Card>
        <Card className="ga-rise" title="Browser" subtitle="Users">
          <BarList rows={simple(r.browsers.map((x) => ({ name: x.browser, ...x })))} />
        </Card>
      </div>

      <Card className="ga-rise" title="Age & gender">
        {r.age.length || r.gender.length ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <BarList rows={r.age.map((a) => ({ key: a.userAgeBracket, label: a.userAgeBracket, value: a.activeUsers, display: fmtNum(a.activeUsers) }))} />
            <BarList rows={r.gender.map((g) => ({ key: g.userGender, label: g.userGender, value: g.activeUsers, display: fmtNum(g.activeUsers) }))} />
          </div>
        ) : (
          <p className="text-[12px] text-gray-500">
            Not available: GA4 only reports age and gender with Google signals turned on (Admin → Data collection). See Data health.
          </p>
        )}
      </Card>
    </div>
  );
}
