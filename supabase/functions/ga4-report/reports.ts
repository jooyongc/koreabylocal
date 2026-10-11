// Request builders and response shaping for ga4-report.
//
// Pure: no Deno or network APIs here, so the same code can be exercised from a
// Node script against the live property before deploying. index.ts does the
// auth, the HTTP calls and the caching.

export interface DateRange { startDate: string; endDate: string }
interface GaRow { dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> }
export interface GaReport {
  dimensionHeaders?: Array<{ name: string }>;
  rows?: GaRow[];
  rowCount?: number;
  propertyQuota?: Record<string, { consumed?: number; remaining?: number }>;
}
export interface ReportSpec { key: string; body: Record<string, unknown> }
type Expr = Record<string, unknown>;
type Row = Record<string, string | number>;

// ── dates ────────────────────────────────────────────────────────────────

/** Today's calendar date in a time zone, as YYYY-MM-DD. */
export function todayIn(tz: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Inclusive day count. */
const span = (start: string, end: string) => Math.round((Date.parse(end) - Date.parse(start)) / 864e5) + 1;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
export const PRESET_DAYS = [7, 14, 28, 90, 180, 365];
export type CompareMode = "previous" | "year" | "none";

export interface Ranges {
  current: DateRange;
  previous: DateRange | null;
  days: number;
  compare: CompareMode;
}

/**
 * A preset ("last N days, today included") or a custom start/end, plus the
 * period it is compared with: the same number of days just before, or the same
 * weeks a year earlier (364 days back, so weekdays line up).
 */
export function resolveRanges(
  input: { days?: unknown; start?: unknown; end?: unknown; compare?: unknown },
  today: string,
): Ranges | { error: string } {
  const compare: CompareMode = input.compare === "year" || input.compare === "none" ? input.compare : "previous";
  let current: DateRange;

  if (typeof input.start === "string" || typeof input.end === "string") {
    const start = String(input.start ?? ""), end = String(input.end ?? "");
    if (!ISO_DATE.test(start) || !ISO_DATE.test(end) || Number.isNaN(Date.parse(start)) || Number.isNaN(Date.parse(end))) {
      return { error: "start and end must be YYYY-MM-DD dates" };
    }
    if (start > end) return { error: "start is after end" };
    if (end > today) return { error: "end is in the future" };
    if (span(start, end) > 731) return { error: "a custom range can be at most two years" };
    current = { startDate: start, endDate: end };
  } else {
    const days = PRESET_DAYS.includes(Number(input.days)) ? Number(input.days) : 28;
    current = { startDate: addDays(today, -(days - 1)), endDate: today };
  }

  const days = span(current.startDate, current.endDate);
  const shift = compare === "year" ? 364 : days;
  const previous = compare === "none"
    ? null
    : { startDate: addDays(current.startDate, -shift), endDate: addDays(current.endDate, -shift) };
  return { current, previous, days, compare };
}

// ── filters ──────────────────────────────────────────────────────────────

const exact = (fieldName: string, value: string): Expr =>
  ({ filter: { fieldName, stringFilter: { matchType: "EXACT", value } } });
const notIn = (fieldName: string, values: string[]): Expr =>
  ({ notExpression: { filter: { fieldName, inListFilter: { values } } } });
const notBeginning = (fieldName: string, value: string): Expr =>
  ({ notExpression: { filter: { fieldName, stringFilter: { matchType: "BEGINS_WITH", value } } } });

function all(...exprs: Array<Expr | null | undefined>): Expr | undefined {
  const list = exprs.filter(Boolean) as Expr[];
  if (list.length === 0) return undefined;
  if (list.length === 1) return list[0];
  return { andGroup: { expressions: list } };
}

/** What every report in one request is narrowed to. */
export interface Scope {
  /** Countries left out as suspected bot traffic. */
  excludeCountries: string[];
  /**
   * Hostnames that count. The old imweb site and localhost report into the
   * same stream; only the live domain is the audience.
   */
  hosts?: string[];
  /** A drill-down: only rows where this dimension has this value. */
  drill?: { dimension: string; value: string };
}

export const LIVE_HOSTS = ["koreabylocal.com", "www.koreabylocal.com"];

const inList = (fieldName: string, values: string[]): Expr =>
  ({ filter: { fieldName, inListFilter: { values } } });

const scopeFilter = (s: Scope) =>
  all(
    s.hosts?.length ? inList("hostName", s.hosts) : null,
    s.excludeCountries.length ? notIn("country", s.excludeCountries) : null,
    s.drill ? exact(s.drill.dimension, s.drill.value) : null,
  );

// The admin's own visits are page views too. They are left out of the
// page-level reports so "most read" means readers, not editors.
const NOT_ADMIN = notBeginning("pagePath", "/admin");
const NOT_ADMIN_LANDING = notBeginning("landingPage", "/admin");

// ── report specs ─────────────────────────────────────────────────────────

const TOTAL_METRICS = [
  "activeUsers", "newUsers", "sessions", "engagedSessions", "screenPageViews",
  "userEngagementDuration", "bounceRate", "eventCount", "keyEvents", "averageSessionDuration",
];
const DAILY_METRICS = [
  "activeUsers", "newUsers", "sessions", "engagedSessions", "screenPageViews",
  "userEngagementDuration", "eventCount", "keyEvents",
];
const TRAFFIC_METRICS = [
  "sessions", "activeUsers", "newUsers", "engagedSessions", "userEngagementDuration",
  "screenPageViews", "keyEvents",
];
const AUDIENCE_METRICS = ["activeUsers", "newUsers", "sessions", "engagedSessions", "userEngagementDuration", "screenPageViews", "keyEvents"];

interface Opts {
  filter?: Expr;
  orderBy?: string;
  orderByDim?: string;
  limit?: number;
  quota?: boolean;
}

function spec(key: string, ranges: DateRange[], dims: string[], mets: string[], scope: Scope, o: Opts = {}): ReportSpec {
  const body: Record<string, unknown> = {
    dateRanges: ranges,
    dimensions: dims.map((name) => ({ name })),
    metrics: mets.map((name) => ({ name })),
    limit: o.limit ?? 100,
  };
  const filter = all(scopeFilter(scope), o.filter);
  if (filter) body.dimensionFilter = filter;
  if (o.orderByDim) body.orderBys = [{ dimension: { dimensionName: o.orderByDim } }];
  else if (dims.length) body.orderBys = [{ metric: { metricName: o.orderBy ?? mets[0] }, desc: true }];
  if (o.quota) body.returnPropertyQuota = true;
  return { key, body };
}

const event = (name: string) => exact("eventName", name);

/** The full dashboard: every report the page renders, in one go. */
export function mainReports(r: Ranges, scope: Scope, cohortWeeks: DateRange[]): ReportSpec[] {
  const C = [r.current];
  const CP = r.previous ? [r.current, r.previous] : C;
  const s = scope;

  const specs: ReportSpec[] = [
    spec("totals", CP, [], TOTAL_METRICS, s, { quota: true }),
    spec("dailyCur", C, ["date"], DAILY_METRICS, s, { orderByDim: "date", limit: 1000 }),
    spec("hourly", C, ["dateHour"], ["sessions", "engagedSessions"], s, { orderByDim: "dateHour", limit: 20000 }),
    spec("userType", CP, ["newVsReturning"], ["activeUsers", "sessions", "engagedSessions", "userEngagementDuration", "screenPageViews"], s),
    spec("channels", CP, ["sessionDefaultChannelGroup"], TRAFFIC_METRICS, s),
    spec("channelDaily", C, ["date", "sessionDefaultChannelGroup"], ["sessions", "engagedSessions"], s, { limit: 10000 }),
    spec("sources", CP, ["sessionSource", "sessionMedium"], TRAFFIC_METRICS, s, { limit: 400 }),
    spec("campaigns", C, ["sessionCampaignName", "sessionSource", "sessionMedium"], TRAFFIC_METRICS, s, {
      filter: notIn("sessionCampaignName", ["(direct)", "(organic)", "(referral)", "(not set)"]),
    }),
    spec("firstUser", C, ["firstUserDefaultChannelGroup"], ["newUsers", "engagedSessions"], s, { limit: 30 }),
    spec("pages", C, ["pagePath", "pageTitle"],
      ["screenPageViews", "activeUsers", "newUsers", "userEngagementDuration", "engagedSessions", "sessions", "eventCount", "keyEvents"],
      s, { filter: NOT_ADMIN, limit: 1000 }),
    spec("landing", CP, ["landingPage"], TRAFFIC_METRICS, s, { filter: NOT_ADMIN_LANDING, limit: 500 }),
    spec("scroll", C, ["pagePath"], ["eventCount"], s, { filter: all(event("scroll"), NOT_ADMIN), limit: 1000 }),
    spec("search", C, ["searchTerm"], ["eventCount", "totalUsers"], s, { filter: event("view_search_results"), limit: 200 }),
    spec("countries", CP, ["country", "countryId"], AUDIENCE_METRICS, s, { limit: 500 }),
    spec("cities", C, ["city", "country"], ["activeUsers", "sessions", "engagedSessions", "userEngagementDuration"], s, { limit: 150 }),
    spec("devices", CP, ["deviceCategory"], AUDIENCE_METRICS, s),
    spec("os", C, ["operatingSystem"], ["activeUsers", "sessions", "engagedSessions"], s, { limit: 20 }),
    spec("browsers", C, ["browser"], ["activeUsers", "sessions", "engagedSessions"], s, { limit: 20 }),
    spec("languages", C, ["language"], ["activeUsers", "sessions", "engagedSessions"], s, { limit: 30 }),
    spec("age", C, ["userAgeBracket"], ["activeUsers"], s),
    spec("gender", C, ["userGender"], ["activeUsers"], s),
    spec("events", CP, ["eventName"], ["eventCount", "totalUsers", "keyEvents"], s, { limit: 400 }),
    spec("outbound", CP, ["linkDomain"], ["eventCount", "totalUsers"], s, { filter: event("click"), limit: 300 }),
    spec("outboundPages", C, ["pagePath", "linkDomain"], ["eventCount", "totalUsers"], s, { filter: all(event("click"), NOT_ADMIN), limit: 500 }),
    // Every hostname, unfiltered — this is the report that shows what the host filter leaves out.
    spec("hosts", C, ["hostName"], ["sessions", "activeUsers", "engagedSessions"], { ...s, hosts: undefined }, { limit: 30 }),
  ];
  if (r.previous) {
    specs.splice(2, 0, spec("dailyPrev", [r.previous], ["date"], DAILY_METRICS, s, { orderByDim: "date", limit: 1000 }));
    specs.push(spec("pagesPrev", [r.previous], ["pagePath"], ["screenPageViews", "activeUsers"], s, { filter: NOT_ADMIN, limit: 1000 }));
  }
  if (cohortWeeks.length) specs.push(cohortSpec(cohortWeeks, s));
  return specs;
}

/** Weekly retention: who came back in the weeks after their first visit. */
function cohortSpec(weeks: DateRange[], scope: Scope): ReportSpec {
  const body: Record<string, unknown> = {
    dimensions: [{ name: "cohort" }, { name: "cohortNthWeek" }],
    metrics: [{ name: "cohortActiveUsers" }, { name: "cohortTotalUsers" }],
    cohortSpec: {
      cohorts: weeks.map((w, i) => ({ name: `c${i}`, dimension: "firstSessionDate", dateRange: w })),
      cohortsRange: { granularity: "WEEKLY", startOffset: 0, endOffset: weeks.length - 1 },
    },
    limit: 500,
  };
  const filter = scopeFilter(scope);
  if (filter) body.dimensionFilter = filter;
  return { key: "cohorts", body };
}

/** Seven-day blocks ending yesterday, newest first. */
export function cohortWeeks(today: string, count = 8): DateRange[] {
  const out: DateRange[] = [];
  for (let i = 0; i < count; i++) {
    const end = addDays(today, -1 - i * 7);
    out.push({ startDate: addDays(end, -6), endDate: end });
  }
  return out;
}

/** The country breakdown used to spot bot traffic before the real reports run. */
export function qualitySpec(r: Ranges): ReportSpec {
  return spec("quality", [r.current], ["country", "countryId"], ["sessions", "engagedSessions", "activeUsers", "userEngagementDuration"],
    { excludeCountries: [], hosts: LIVE_HOSTS }, { limit: 300 });
}

export const DRILL_DIMENSIONS = [
  "pagePath", "landingPage", "sessionDefaultChannelGroup", "sessionSourceMedium",
  "sessionCampaignName", "country", "deviceCategory", "eventName", "newVsReturning",
];

/** Everything about one page, channel, source, campaign, country, device or event. */
export function drillReports(r: Ranges, scope: Scope): ReportSpec[] {
  const C = [r.current];
  const CP = r.previous ? [r.current, r.previous] : C;
  const s = scope;
  const specs: ReportSpec[] = [
    spec("totals", CP, [], TOTAL_METRICS, s),
    spec("dailyCur", C, ["date"], DAILY_METRICS, s, { orderByDim: "date", limit: 1000 }),
    spec("pages", C, ["pagePath", "pageTitle"], ["screenPageViews", "activeUsers", "userEngagementDuration"], s, { filter: NOT_ADMIN, limit: 50 }),
    spec("landing", C, ["landingPage"], ["sessions", "engagedSessions"], s, { filter: NOT_ADMIN_LANDING, limit: 25 }),
    spec("sources", C, ["sessionSource", "sessionMedium"], ["sessions", "engagedSessions", "activeUsers"], s, { limit: 25 }),
    spec("countries", C, ["country", "countryId"], ["activeUsers", "sessions", "engagedSessions"], s, { limit: 25 }),
    spec("devices", C, ["deviceCategory"], ["activeUsers", "sessions", "engagedSessions"], s),
    spec("events", C, ["eventName"], ["eventCount", "totalUsers"], s, { limit: 30 }),
    spec("outbound", C, ["linkDomain"], ["eventCount", "totalUsers"], s, { filter: event("click"), limit: 25 }),
  ];
  if (r.previous) specs.splice(2, 0, spec("dailyPrev", [r.previous], ["date"], DAILY_METRICS, s, { orderByDim: "date", limit: 1000 }));
  return specs;
}

/** Realtime is its own endpoint (last 30 minutes) and cannot be batched. */
export const REALTIME_SPECS: ReportSpec[] = [
  { key: "total", body: { metrics: [{ name: "activeUsers" }] } },
  { key: "minutes", body: { dimensions: [{ name: "minutesAgo" }], metrics: [{ name: "activeUsers" }], limit: 30 } },
  { key: "pages", body: { dimensions: [{ name: "unifiedScreenName" }], metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }], limit: 25 } },
  { key: "countries", body: { dimensions: [{ name: "country" }], metrics: [{ name: "activeUsers" }], limit: 25 } },
  { key: "devices", body: { dimensions: [{ name: "deviceCategory" }], metrics: [{ name: "activeUsers" }] } },
  { key: "events", body: { dimensions: [{ name: "eventName" }], metrics: [{ name: "eventCount" }], limit: 25 } },
];

// ── shaping ──────────────────────────────────────────────────────────────

const num = (v: string | undefined) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

/** Flattens GA4's parallel dimension/metric arrays into plain objects. */
export function flat(report: GaReport | undefined, dims: string[], mets: string[]): Row[] {
  return (report?.rows ?? []).map((r) => {
    const out: Row = {};
    dims.forEach((d, i) => { out[d] = r.dimensionValues?.[i]?.value ?? ""; });
    mets.forEach((m, i) => { out[m] = num(r.metricValues?.[i]?.value); });
    return out;
  });
}

/**
 * A report run over [current, previous] comes back as one row per value per
 * range, tagged with a trailing `dateRange` dimension. This folds the pair into
 * one row: the current metrics at the top level, the previous ones under `prev`.
 * Values seen only in the previous period stay, with zeros for now — those are
 * the ones that dropped away.
 */
export function ranged(report: GaReport | undefined, dims: string[], mets: string[]) {
  const headers = (report?.dimensionHeaders ?? []).map((h) => h.name);
  const rangeAt = headers.indexOf("dateRange");
  const byKey = new Map<string, Row & { prev: Record<string, number> }>();
  for (const r of report?.rows ?? []) {
    const values = dims.map((_, i) => r.dimensionValues?.[i]?.value ?? "");
    const key = values.join("\u0001");
    let row = byKey.get(key);
    if (!row) {
      row = { prev: Object.fromEntries(mets.map((m) => [m, 0])) } as Row & { prev: Record<string, number> };
      dims.forEach((d, i) => { row![d] = values[i]; });
      mets.forEach((m) => { row![m] = 0; });
      byKey.set(key, row);
    }
    const isPrev = rangeAt >= 0 && r.dimensionValues?.[rangeAt]?.value === "date_range_1";
    mets.forEach((m, i) => {
      const v = num(r.metricValues?.[i]?.value);
      if (isPrev) row!.prev[m] = v;
      else row![m] = v;
    });
  }
  return [...byKey.values()].sort((a, b) => Number(b[mets[0]]) - Number(a[mets[0]]));
}

/** Totals for each range, keyed by metric. */
export function totalsOf(report: GaReport | undefined) {
  const headers = (report?.dimensionHeaders ?? []).map((h) => h.name);
  const rangeAt = headers.indexOf("dateRange");
  const out: { current: Record<string, number>; previous: Record<string, number> | null } = { current: {}, previous: null };
  for (const r of report?.rows ?? []) {
    const values = Object.fromEntries(TOTAL_METRICS.map((m, i) => [m, num(r.metricValues?.[i]?.value)]));
    if (rangeAt >= 0 && r.dimensionValues?.[rangeAt]?.value === "date_range_1") out.previous = values;
    else out.current = values;
  }
  for (const m of TOTAL_METRICS) out.current[m] ??= 0;
  return out;
}

/** One row per calendar day of the range — GA4 leaves out days with no data. */
export function fillDaily(report: GaReport | undefined, range: DateRange) {
  const byDate = new Map(flat(report, ["date"], DAILY_METRICS).map((r) => [String(r.date), r]));
  const out: Row[] = [];
  for (let d = range.startDate; d <= range.endDate; d = addDays(d, 1)) {
    const hit = byDate.get(d.replaceAll("-", ""));
    out.push({ ...Object.fromEntries(DAILY_METRICS.map((m) => [m, 0])), ...(hit ?? {}), date: d });
  }
  return out;
}

// GA4 reports hours in the property's time zone (this one is Los Angeles).
// The admin plans posts on Korea time, so the weekday × hour grid is built in
// both: wall time in the property zone → UTC instant → KST (no DST in Korea).
function offsetMs(utcMs: number, fmt: Intl.DateTimeFormat): number {
  const p = Object.fromEntries(fmt.formatToParts(new Date(utcMs)).map((x) => [x.type, x.value]));
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - utcMs;
}

export function heatmaps(report: GaReport | undefined, propertyTz: string) {
  const grid = () => Array.from({ length: 7 }, () => new Array(24).fill(0));
  const property = { sessions: grid(), engaged: grid() };
  const kst = { sessions: grid(), engaged: grid() };
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: propertyTz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  // Monday = 0 … Sunday = 6
  const monFirst = (utcDay: number) => (utcDay + 6) % 7;

  for (const r of flat(report, ["dateHour"], ["sessions", "engagedSessions"])) {
    const s = String(r.dateHour);
    const y = +s.slice(0, 4), mo = +s.slice(4, 6), d = +s.slice(6, 8), h = +s.slice(8, 10);
    const sessions = Number(r.sessions), engaged = Number(r.engagedSessions);

    const wd = monFirst(new Date(Date.UTC(y, mo - 1, d)).getUTCDay());
    property.sessions[wd][h] += sessions;
    property.engaged[wd][h] += engaged;

    const guess = Date.UTC(y, mo - 1, d, h);
    let utc = guess - offsetMs(guess, fmt);
    const again = guess - offsetMs(utc, fmt);
    if (again !== utc) utc = again; // the hour right after a DST switch
    const k = new Date(utc + 9 * 3600e3);
    kst.sessions[monFirst(k.getUTCDay())][k.getUTCHours()] += sessions;
    kst.engaged[monFirst(k.getUTCDay())][k.getUTCHours()] += engaged;
  }
  return { property, kst };
}

export function cohortsOf(report: GaReport | undefined, weeks: DateRange[]) {
  const rows = flat(report, ["cohort", "cohortNthWeek"], ["cohortActiveUsers", "cohortTotalUsers"]);
  return weeks.map((w, i) => {
    const mine = rows.filter((r) => r.cohort === `c${i}`);
    const size = Math.max(0, ...mine.map((r) => Number(r.cohortTotalUsers)));
    // Weeks that have not happened yet are null, not zero.
    const elapsed = i + 1;
    const active = Array.from({ length: weeks.length }, (_, n) =>
      n < elapsed ? Number(mine.find((r) => Number(r.cohortNthWeek) === n)?.cohortActiveUsers ?? 0) : null
    );
    return { start: w.startDate, end: w.endDate, size, active };
  });
}

/**
 * Countries whose sessions are numerous but almost never engaged — the usual
 * signature of crawlers and click farms (here: datacenter traffic from
 * Singapore, China, Indonesia). A country is flagged only when it is big
 * enough to matter and its engagement is far below any real audience.
 */
export function suspectCountries(report: GaReport | undefined) {
  const rows = flat(report, ["country", "countryId"], ["sessions", "engagedSessions", "activeUsers", "userEngagementDuration"]);
  const total = rows.reduce((n, r) => n + Number(r.sessions), 0);
  const floor = Math.max(30, total * 0.02);
  return rows
    .filter((r) => r.country && r.country !== "(not set)")
    .map((r) => {
      const sessions = Number(r.sessions);
      const engagementRate = sessions ? Number(r.engagedSessions) / sessions : 0;
      const secondsPerUser = Number(r.activeUsers) ? Number(r.userEngagementDuration) / Number(r.activeUsers) : 0;
      return { country: String(r.country), countryId: String(r.countryId), sessions, users: Number(r.activeUsers), engagementRate, secondsPerUser };
    })
    .filter((c) => c.sessions >= floor && c.engagementRate < 0.08 && c.secondsPerUser < 10)
    .sort((a, b) => b.sessions - a.sessions);
}

export function quotaOf(report: GaReport | undefined) {
  const q = report?.propertyQuota;
  if (!q) return null;
  return {
    hourRemaining: q.tokensPerHour?.remaining ?? null,
    hourConsumed: q.tokensPerHour?.consumed ?? null,
    dayRemaining: q.tokensPerDay?.remaining ?? null,
    dayConsumed: q.tokensPerDay?.consumed ?? null,
    projectHourRemaining: q.tokensPerProjectPerHour?.remaining ?? null,
  };
}

/** The whole dashboard payload, from the reports keyed by spec. */
export function shapeMain(
  reports: Record<string, GaReport | undefined>,
  r: Ranges,
  propertyTz: string,
  weeks: DateRange[],
) {
  const T = TRAFFIC_METRICS, A = AUDIENCE_METRICS;

  // A path can carry several titles (a renamed post, a translated title); the
  // one with the most views names the row.
  const pageRows = flat(reports.pages, ["pagePath", "pageTitle"],
    ["screenPageViews", "activeUsers", "newUsers", "userEngagementDuration", "engagedSessions", "sessions", "eventCount", "keyEvents"]);
  const pages = new Map<string, Row & { titleViews: number }>();
  for (const p of pageRows) {
    const path = String(p.pagePath);
    const cur = pages.get(path);
    if (!cur) { pages.set(path, { ...p, titleViews: Number(p.screenPageViews) }); continue; }
    for (const [k, v] of Object.entries(p)) if (typeof v === "number") cur[k] = Number(cur[k] ?? 0) + v;
    if (Number(p.screenPageViews) > cur.titleViews) { cur.pageTitle = p.pageTitle; cur.titleViews = Number(p.screenPageViews); }
  }
  const prevViews = new Map(flat(reports.pagesPrev, ["pagePath"], ["screenPageViews", "activeUsers"]).map((p) => [String(p.pagePath), p]));
  const scroll = new Map(flat(reports.scroll, ["pagePath"], ["eventCount"]).map((p) => [String(p.pagePath), Number(p.eventCount)]));

  return {
    range: { ...r.current, days: r.days },
    compare: r.previous ? { ...r.previous, mode: r.compare } : null,
    timeZone: propertyTz,
    totals: totalsOf(reports.totals),
    quota: quotaOf(reports.totals),
    daily: {
      current: fillDaily(reports.dailyCur, r.current),
      previous: r.previous ? fillDaily(reports.dailyPrev, r.previous) : [],
    },
    heatmap: heatmaps(reports.hourly, propertyTz),
    userType: ranged(reports.userType, ["newVsReturning"], ["activeUsers", "sessions", "engagedSessions", "userEngagementDuration", "screenPageViews"]),
    channels: ranged(reports.channels, ["sessionDefaultChannelGroup"], T),
    channelDaily: flat(reports.channelDaily, ["date", "sessionDefaultChannelGroup"], ["sessions", "engagedSessions"]),
    sources: ranged(reports.sources, ["sessionSource", "sessionMedium"], T),
    campaigns: flat(reports.campaigns, ["sessionCampaignName", "sessionSource", "sessionMedium"], T),
    firstUser: flat(reports.firstUser, ["firstUserDefaultChannelGroup"], ["newUsers", "engagedSessions"]),
    pages: [...pages.values()].map((p) => {
      const path = String(p.pagePath);
      const prev = prevViews.get(path);
      const row: Row = {
        ...p,
        scrolls: scroll.get(path) ?? 0,
        prevViews: Number(prev?.screenPageViews ?? 0),
        prevUsers: Number(prev?.activeUsers ?? 0),
      };
      delete row.titleViews;
      return row;
    }).sort((a, b) => Number(b.screenPageViews) - Number(a.screenPageViews)),
    landing: ranged(reports.landing, ["landingPage"], T),
    search: flat(reports.search, ["searchTerm"], ["eventCount", "totalUsers"]),
    countries: ranged(reports.countries, ["country", "countryId"], A),
    cities: flat(reports.cities, ["city", "country"], ["activeUsers", "sessions", "engagedSessions", "userEngagementDuration"]),
    devices: ranged(reports.devices, ["deviceCategory"], A),
    os: flat(reports.os, ["operatingSystem"], ["activeUsers", "sessions", "engagedSessions"]),
    browsers: flat(reports.browsers, ["browser"], ["activeUsers", "sessions", "engagedSessions"]),
    languages: flat(reports.languages, ["language"], ["activeUsers", "sessions", "engagedSessions"]),
    age: flat(reports.age, ["userAgeBracket"], ["activeUsers"]),
    gender: flat(reports.gender, ["userGender"], ["activeUsers"]),
    events: ranged(reports.events, ["eventName"], ["eventCount", "totalUsers", "keyEvents"]),
    outbound: ranged(reports.outbound, ["linkDomain"], ["eventCount", "totalUsers"]),
    outboundPages: flat(reports.outboundPages, ["pagePath", "linkDomain"], ["eventCount", "totalUsers"]),
    hosts: flat(reports.hosts, ["hostName"], ["sessions", "activeUsers", "engagedSessions"]),
    cohorts: cohortsOf(reports.cohorts, weeks),
  };
}

export function shapeDrill(reports: Record<string, GaReport | undefined>, r: Ranges) {
  return {
    range: { ...r.current, days: r.days },
    compare: r.previous ? { ...r.previous, mode: r.compare } : null,
    totals: totalsOf(reports.totals),
    daily: {
      current: fillDaily(reports.dailyCur, r.current),
      previous: r.previous ? fillDaily(reports.dailyPrev, r.previous) : [],
    },
    pages: flat(reports.pages, ["pagePath", "pageTitle"], ["screenPageViews", "activeUsers", "userEngagementDuration"]),
    landing: flat(reports.landing, ["landingPage"], ["sessions", "engagedSessions"]),
    sources: flat(reports.sources, ["sessionSource", "sessionMedium"], ["sessions", "engagedSessions", "activeUsers"]),
    countries: flat(reports.countries, ["country", "countryId"], ["activeUsers", "sessions", "engagedSessions"]),
    devices: flat(reports.devices, ["deviceCategory"], ["activeUsers", "sessions", "engagedSessions"]),
    events: flat(reports.events, ["eventName"], ["eventCount", "totalUsers"]),
    outbound: flat(reports.outbound, ["linkDomain"], ["eventCount", "totalUsers"]),
  };
}

export function shapeRealtime(reports: Record<string, GaReport | undefined>) {
  const minutes = new Array(30).fill(0);
  for (const m of flat(reports.minutes, ["minutesAgo"], ["activeUsers"])) {
    const i = Number(m.minutesAgo);
    if (i >= 0 && i < 30) minutes[i] = Number(m.activeUsers);
  }
  return {
    activeUsers: Number(flat(reports.total, [], ["activeUsers"])[0]?.activeUsers ?? 0),
    minutes,
    // Admin screens are the editor, not an audience.
    pages: flat(reports.pages, ["unifiedScreenName"], ["activeUsers", "screenPageViews"])
      .filter((p) => !/\|\s*Korea By Local Admin$/i.test(String(p.unifiedScreenName))),
    countries: flat(reports.countries, ["country"], ["activeUsers"]),
    devices: flat(reports.devices, ["deviceCategory"], ["activeUsers"]),
    events: flat(reports.events, ["eventName"], ["eventCount"]),
  };
}
