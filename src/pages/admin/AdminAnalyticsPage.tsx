import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw, AlertTriangle, Circle } from "lucide-react";
import { supabase } from "@/lib/supabase";

/**
 * GA4 for the admin.
 *
 * Everything is read through the ga4-report edge function: the Data API needs
 * a service account, and a service-account key in front-end code is a key
 * given away. The browser never sees it.
 */

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 28, label: "28 days" },
  { days: 90, label: "90 days" },
  { days: 365, label: "1 year" },
];

interface Metric { value: number; previous: number }

interface Report {
  success: true;
  days: number;
  generated_at: string;
  cached?: boolean;
  summary: Record<string, Metric>;
  daily: Array<{ date: string; activeUsers: number; sessions: number; screenPageViews: number }>;
  pages: Array<{ pagePath: string; pageTitle: string; screenPageViews: number; activeUsers: number }>;
  channels: Array<{ channel: string; sessions: number; activeUsers: number; engagementRate: number }>;
  sources: Array<{ source: string; medium: string; sessions: number; activeUsers: number }>;
  countries: Array<{ country: string; activeUsers: number; sessions: number }>;
  devices: Array<{ device: string; activeUsers: number; sessions: number }>;
  landing: Array<{ landingPage: string; sessions: number; bounceRate: number }>;
  events: Array<{ eventName: string; eventCount: number; activeUsers: number }>;
  realtime: { activeUsers: number; screens: Array<{ screen: string; activeUsers: number }> };
}

const nf = new Intl.NumberFormat("en-US");

const duration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const SUMMARY_CARDS: Array<{ key: string; label: string; format: (n: number) => string; lowerIsBetter?: boolean }> = [
  { key: "activeUsers", label: "Users", format: (n) => nf.format(n) },
  { key: "newUsers", label: "New users", format: (n) => nf.format(n) },
  { key: "sessions", label: "Sessions", format: (n) => nf.format(n) },
  { key: "screenPageViews", label: "Page views", format: (n) => nf.format(n) },
  { key: "averageSessionDuration", label: "Avg. session", format: duration },
  { key: "engagementRate", label: "Engaged", format: (n) => `${(n * 100).toFixed(1)}%` },
  { key: "bounceRate", label: "Bounce", format: (n) => `${(n * 100).toFixed(1)}%`, lowerIsBetter: true },
  { key: "eventCount", label: "Events", format: (n) => nf.format(n) },
];

function Delta({ metric, lowerIsBetter }: { metric: Metric; lowerIsBetter?: boolean }) {
  if (!metric.previous) return <span className="text-[11px] text-gray-400">no prior data</span>;
  const change = ((metric.value - metric.previous) / metric.previous) * 100;
  const good = lowerIsBetter ? change < 0 : change > 0;
  const flat = Math.abs(change) < 0.05;
  return (
    <span className={`text-[11px] font-medium ${flat ? "text-gray-400" : good ? "text-emerald-600" : "text-red-500"}`}>
      {flat ? "—" : `${change > 0 ? "+" : ""}${change.toFixed(1)}%`}
    </span>
  );
}

/** A plain bar list. Reads faster than a chart for ranked values. */
function Ranked({
  title, rows, labelOf, valueOf, hint,
}: {
  title: string;
  rows: Array<Record<string, string | number>>;
  labelOf: (r: Record<string, string | number>) => string;
  valueOf: (r: Record<string, string | number>) => number;
  hint?: (r: Record<string, string | number>) => string;
}) {
  const max = Math.max(1, ...rows.map(valueOf));
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold text-primary">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-400">No data in this period.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r, i) => (
            <li key={i}>
              <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
                <span className="truncate text-gray-700" title={labelOf(r)}>{labelOf(r)}</span>
                <span className="shrink-0 font-medium text-gray-800">
                  {nf.format(valueOf(r))}
                  {hint && <span className="ml-1.5 text-[11px] font-normal text-gray-400">{hint(r)}</span>}
                </span>
              </div>
              <div className="mt-1 h-1 rounded bg-gray-100">
                <div className="h-1 rounded bg-primary/60" style={{ width: `${(valueOf(r) / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Daily trend as an inline sparkline — no chart library for three series. */
function Trend({ daily }: { daily: Report["daily"] }) {
  const { path, max } = useMemo(() => {
    if (daily.length < 2) return { path: "", max: 0 };
    const top = Math.max(1, ...daily.map((d) => d.activeUsers));
    const pts = daily.map((d, i) => {
      const x = (i / (daily.length - 1)) * 100;
      const y = 100 - (d.activeUsers / top) * 100;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });
    return { path: `M${pts.join(" L")}`, max: top };
  }, [daily]);

  if (!path) return null;
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-primary">Users per day</h2>
        <span className="text-[11px] text-gray-400">peak {nf.format(max)}</span>
      </div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-28 w-full">
        <path d={path} fill="none" stroke="#12184a" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-1 flex justify-between text-[10.5px] text-gray-400">
        <span>{daily[0]?.date}</span>
        <span>{daily[daily.length - 1]?.date}</span>
      </div>
    </section>
  );
}

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(28);

  const { data, error, isLoading, isFetching, refetch } = useQuery<Report>({
    queryKey: ["ga4", days],
    staleTime: 5 * 60 * 1000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("ga4-report", { body: { days } });
      if (error) {
        let detail = error.message;
        try {
          const ctx = (error as { context?: Response }).context;
          if (ctx) {
            const body = await ctx.json();
            detail = body?.detail ?? body?.error ?? detail;
          }
        } catch { /* keep the original message */ }
        throw new Error(detail);
      }
      return data as Report;
    },
  });

  return (
    <>
      <Helmet><title>Analytics | Korea By Local Admin</title></Helmet>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-primary">Analytics</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Live GA4 numbers for koreabylocal.com, compared with the period before.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {data && (
              <span className="mr-1 flex items-center gap-1.5 text-[12px] text-gray-500">
                <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
                {nf.format(data.realtime.activeUsers)} on the site now
              </span>
            )}
            <div className="flex rounded-lg border border-gray-300 p-0.5">
              {RANGES.map((r) => (
                <button
                  key={r.days}
                  type="button"
                  onClick={() => setDays(r.days)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                    days === r.days ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-900">Analytics is not available yet</p>
                <p className="mt-1 text-sm text-amber-800">{(error as Error).message}</p>
                <p className="mt-3 text-xs leading-relaxed text-amber-700">
                  It needs a Google service account with the Analytics Data API enabled, stored as the
                  Supabase secrets <code className="font-mono">GA4_PROPERTY_ID</code> (the numeric property
                  id, not the G-… measurement id) and <code className="font-mono">GA4_SERVICE_ACCOUNT</code>.
                  The service account's email also has to be a Viewer on the GA4 property.
                </p>
              </div>
            </div>
          </div>
        ) : data ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {SUMMARY_CARDS.map((card) => {
                const m = data.summary[card.key];
                if (!m) return null;
                return (
                  <div key={card.key} className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{card.label}</div>
                    <div className="mt-1 text-xl font-bold text-primary">{card.format(m.value)}</div>
                    <Delta metric={m} lowerIsBetter={card.lowerIsBetter} />
                  </div>
                );
              })}
            </div>

            <Trend daily={data.daily} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Ranked
                title="Most read"
                rows={data.pages}
                labelOf={(r) => String(r.pageTitle || r.pagePath)}
                valueOf={(r) => Number(r.screenPageViews)}
              />
              <Ranked
                title="How they arrive"
                rows={data.channels}
                labelOf={(r) => String(r.channel)}
                valueOf={(r) => Number(r.sessions)}
                hint={(r) => `${(Number(r.engagementRate) * 100).toFixed(0)}% engaged`}
              />
              <Ranked
                title="Sources"
                rows={data.sources}
                labelOf={(r) => `${r.source} / ${r.medium}`}
                valueOf={(r) => Number(r.sessions)}
              />
              <Ranked
                title="Landing pages"
                rows={data.landing}
                labelOf={(r) => String(r.landingPage)}
                valueOf={(r) => Number(r.sessions)}
                hint={(r) => `${(Number(r.bounceRate) * 100).toFixed(0)}% bounce`}
              />
              <Ranked
                title="Countries"
                rows={data.countries}
                labelOf={(r) => String(r.country)}
                valueOf={(r) => Number(r.activeUsers)}
              />
              <Ranked
                title="Devices"
                rows={data.devices}
                labelOf={(r) => String(r.device)}
                valueOf={(r) => Number(r.activeUsers)}
              />
              <Ranked
                title="Events"
                rows={data.events}
                labelOf={(r) => String(r.eventName)}
                valueOf={(r) => Number(r.eventCount)}
              />
              <Ranked
                title="On the site now"
                rows={data.realtime.screens}
                labelOf={(r) => String(r.screen)}
                valueOf={(r) => Number(r.activeUsers)}
              />
            </div>

            <p className="text-[11px] text-gray-400">
              Reports are cached for five minutes to stay inside the GA4 quota
              {data.cached ? " — showing a cached copy" : ""}. The live visitor count is not cached.
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}
