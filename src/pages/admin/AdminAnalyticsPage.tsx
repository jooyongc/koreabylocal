import { useCallback, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity, AlertTriangle, BarChart3, CalendarRange, Download, FileText, Globe2, HeartPulse, Loader2,
  MousePointerClick, RefreshCw, Repeat, ShieldAlert, Users,
} from "lucide-react";
import { AnalyticsMotionStyles } from "@/components/admin/analytics/motion";
import { DrillContext, TabContext } from "@/components/admin/analytics/context";
import { DrillDrawer } from "@/components/admin/analytics/DrillDrawer";
import { Segmented, Switch } from "@/components/admin/analytics/ui";
import { derive } from "@/components/admin/analytics/derive";
import { buildInsights, type TabKey } from "@/components/admin/analytics/insights";
import { buildHealth } from "@/components/admin/analytics/health";
import { download, fmtNum, fmtPct, fmtRange, ratio } from "@/components/admin/analytics/format";
import { refreshReport, reportKey, useAnalyticsReport, useRealtime } from "@/components/admin/analytics/useAnalytics";
import type { CompareMode, DrillTarget, RangeParams } from "@/components/admin/analytics/types";
import { OverviewTab } from "@/components/admin/analytics/tabs/OverviewTab";
import { AcquisitionTab } from "@/components/admin/analytics/tabs/AcquisitionTab";
import { ContentTab } from "@/components/admin/analytics/tabs/ContentTab";
import { AudienceTab } from "@/components/admin/analytics/tabs/AudienceTab";
import { EngagementTab } from "@/components/admin/analytics/tabs/EngagementTab";
import { RetentionTab } from "@/components/admin/analytics/tabs/RetentionTab";
import { RealtimeTab } from "@/components/admin/analytics/tabs/RealtimeTab";
import { HealthTab } from "@/components/admin/analytics/tabs/HealthTab";

/**
 * GA4 for the admin: what happened, where it came from, what people read and
 * clicked, who they are, whether they come back — plus a plain-language read
 * of it and a list of what skews the numbers.
 *
 * Everything comes through the ga4-report edge function (the Data API needs a
 * credential the browser must never see). Filters live in the URL, so a view
 * can be bookmarked or shared.
 */

const TABS: Array<{ key: TabKey; label: string; icon: typeof Activity }> = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "acquisition", label: "Acquisition", icon: Globe2 },
  { key: "content", label: "Content", icon: FileText },
  { key: "audience", label: "Audience", icon: Users },
  { key: "engagement", label: "Engagement", icon: MousePointerClick },
  { key: "retention", label: "Retention", icon: Repeat },
  { key: "realtime", label: "Realtime", icon: Activity },
  { key: "health", label: "Data health", icon: HeartPulse },
];

const PRESETS = [
  { value: "7", label: "7D" },
  { value: "14", label: "14D" },
  { value: "28", label: "28D" },
  { value: "90", label: "90D" },
  { value: "180", label: "6M" },
  { value: "365", label: "1Y" },
  { value: "custom", label: "Custom" },
];

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export default function AdminAnalyticsPage() {
  const [sp, setSp] = useSearchParams();
  const qc = useQueryClient();

  const tab = (TABS.some((t) => t.key === sp.get("tab")) ? sp.get("tab") : "overview") as TabKey;
  const rangeKey = PRESETS.some((p) => p.value === sp.get("range")) ? sp.get("range")! : "28";
  const start = sp.get("start") ?? "";
  const end = sp.get("end") ?? "";
  const compare = (["previous", "year", "none"].includes(sp.get("compare") ?? "") ? sp.get("compare") : "previous") as CompareMode;
  const excludeBots = sp.get("bots") !== "all";

  const customReady = rangeKey === "custom" && ISO.test(start) && ISO.test(end) && start <= end;
  const params: RangeParams = customReady
    ? { start, end, compare, excludeBots }
    : { days: rangeKey === "custom" ? 28 : Number(rangeKey), compare, excludeBots };

  const set = useCallback((patch: Record<string, string | null>) => {
    setSp((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) {
        if (v == null) next.delete(k);
        else next.set(k, v);
      }
      return next;
    }, { replace: true });
  }, [setSp]);

  const { data: r, error, isLoading, isFetching } = useAnalyticsReport(params);
  const live = useRealtime(true, tab === "realtime" ? 30_000 : 60_000);

  const [drill, setDrill] = useState<DrillTarget | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [draft, setDraft] = useState({ start, end });

  const derived = useMemo(() => (r ? derive(r) : null), [r]);
  const insights = useMemo(() => (r && derived ? buildInsights(r, derived) : []), [r, derived]);
  const health = useMemo(() => (r && derived ? buildHealth(r, derived) : []), [r, derived]);
  const healthIssues = health.filter((h) => h.severity === "critical" || h.severity === "warning").length;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const fresh = await refreshReport(params);
      qc.setQueryData(reportKey(params), fresh);
      await live.refetch();
    } catch {
      /* the query's own error state shows failures */
    } finally {
      setRefreshing(false);
    }
  };

  const onExport = () => {
    if (!r) return;
    download(`koreabylocal-ga4-${r.range.startDate}_${r.range.endDate}.json`, JSON.stringify(r, null, 2), "application/json");
  };

  const suspects = r?.quality.suspects ?? [];
  const botSessions = suspects.reduce((n, s) => n + s.sessions, 0);

  return (
    <DrillContext.Provider value={setDrill}>
      <TabContext.Provider value={(t) => { set({ tab: t }); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
        <Helmet><title>Analytics | Korea By Local Admin</title></Helmet>
        <AnalyticsMotionStyles />

        <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-6 lg:py-8">
          {/* Title */}
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-primary">Analytics</h1>
              <p className="mt-1 text-sm text-text-secondary">
                GA4 for koreabylocal.com
                {r && <> · {fmtRange(r.range.startDate, r.range.endDate)}{r.compare && <span className="text-gray-400"> vs {fmtRange(r.compare.startDate, r.compare.endDate)}</span>}</>}
              </p>
            </div>
            <button
              type="button"
              onClick={() => set({ tab: "realtime" })}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12px] font-medium text-emerald-800 hover:bg-emerald-100"
            >
              <span className="relative flex h-2 w-2">
                <span className="ga-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-500" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              {live.data ? `${fmtNum(live.data.activeUsers)} on the site now` : "Live"}
            </button>
          </div>

          {/* One filter row — it scopes everything below */}
          <div className="mb-4 flex flex-wrap items-center gap-2.5 rounded-2xl border border-gray-200/80 bg-white p-2.5">
            <Segmented
              value={rangeKey}
              onChange={(v) => set({ range: v === "28" ? null : v, ...(v !== "custom" ? { start: null, end: null } : {}) })}
              options={PRESETS}
            />
            {rangeKey === "custom" && (
              <form
                className="flex items-center gap-1.5"
                onSubmit={(e) => { e.preventDefault(); if (draft.start && draft.end && draft.start <= draft.end) set({ start: draft.start, end: draft.end }); }}
              >
                <CalendarRange className="h-4 w-4 text-gray-400" aria-hidden />
                <input type="date" value={draft.start} max={draft.end || undefined} onChange={(e) => setDraft((d) => ({ ...d, start: e.target.value }))} className="rounded-lg border border-gray-200 px-2 py-1 text-[12px]" aria-label="Start date" />
                <span className="text-gray-400">–</span>
                <input type="date" value={draft.end} min={draft.start || undefined} onChange={(e) => setDraft((d) => ({ ...d, end: e.target.value }))} className="rounded-lg border border-gray-200 px-2 py-1 text-[12px]" aria-label="End date" />
                <button type="submit" className="rounded-lg bg-primary px-2.5 py-1 text-[12px] font-medium text-white hover:bg-primary/90">Apply</button>
              </form>
            )}
            <label className="flex items-center gap-1.5 text-[12px] text-gray-600">
              <span className="sr-only sm:not-sr-only">Compare</span>
              <select
                value={compare}
                onChange={(e) => set({ compare: e.target.value === "previous" ? null : e.target.value })}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[12px] font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/10"
              >
                <option value="previous">vs previous period</option>
                <option value="year">vs same weeks last year</option>
                <option value="none">no comparison</option>
              </select>
            </label>
            <Switch
              checked={excludeBots}
              onChange={(v) => set({ bots: v ? null : "all" })}
              label={<>Exclude suspected bots{suspects.length > 0 && <span className="ml-1 rounded-full bg-gray-100 px-1.5 text-[10.5px] text-gray-500">{suspects.length}</span>}</>}
              hint="Leaves out countries with many sessions and almost no engagement (crawlers and click farms)."
            />
            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={onExport}
                disabled={!r}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[12px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                title="Download the whole report as JSON"
              >
                <Download className="h-3.5 w-3.5" /> Export
              </button>
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing || isFetching}
                className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                title="Refresh (skips the five-minute cache)"
                aria-label="Refresh"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing || isFetching ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* What the numbers include */}
          {r && suspects.length > 0 && (
            <div className={`ga-fade mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-4 py-2.5 text-[12px] ${excludeBots ? "bg-indigo-50/70 text-indigo-900" : "bg-red-50 text-[#8f1d1d]"}`}>
              <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden />
              {excludeBots ? (
                <span>
                  <strong>Suspected bot traffic excluded:</strong> {suspects.map((s) => s.country).join(", ")} — {fmtNum(botSessions)} sessions,{" "}
                  {fmtPct(ratio(botSessions, botSessions + r.totals.current.sessions), 0)} of all traffic, with almost no engagement.
                </span>
              ) : (
                <span>
                  <strong>Including suspected bots:</strong> {fmtNum(botSessions)} sessions from {suspects.map((s) => s.country).join(", ")} ({fmtPct(ratio(botSessions, r.totals.current.sessions), 0)}) drag every rate down.
                </span>
              )}
              <button type="button" onClick={() => set({ bots: excludeBots ? "all" : null })} className="ml-auto font-semibold underline-offset-2 hover:underline">
                {excludeBots ? "Show all traffic" : "Exclude them"}
              </button>
            </div>
          )}

          {/* Tabs */}
          <nav className="sticky top-0 z-30 -mx-4 mb-5 border-b border-gray-200 bg-[#fafaf8]/90 px-4 backdrop-blur lg:-mx-6 lg:px-6" aria-label="Analytics sections">
            <div className="scrollbar-hide flex gap-1 overflow-x-auto">
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => set({ tab: t.key === "overview" ? null : t.key })}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex shrink-0 items-center gap-1.5 px-3 py-3 text-[12.5px] font-medium transition-colors ${active ? "text-primary" : "text-gray-500 hover:text-gray-800"}`}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {t.label}
                    {t.key === "health" && healthIssues > 0 && (
                      <span className="rounded-full bg-amber-100 px-1.5 text-[10px] font-bold text-amber-800">{healthIssues}</span>
                    )}
                    {t.key === "realtime" && live.data && (
                      <span className="rounded-full bg-emerald-100 px-1.5 text-[10px] font-bold text-emerald-800">{live.data.activeUsers}</span>
                    )}
                    {active && <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-accent" aria-hidden />}
                  </button>
                );
              })}
            </div>
          </nav>

          {tab === "realtime" ? (
            <RealtimeTab data={live.data} error={live.error as Error | null} isFetching={live.isFetching} updatedAt={live.dataUpdatedAt} />
          ) : isLoading ? (
            <div className="space-y-5" aria-busy="true">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {Array.from({ length: 8 }, (_, i) => <div key={i} className="ga-shimmer h-[132px] rounded-2xl" />)}
              </div>
              <div className="ga-shimmer h-[330px] rounded-2xl" />
              <p className="flex items-center justify-center gap-2 text-[12px] text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Reading GA4 — about 30 reports…
              </p>
            </div>
          ) : error && !r ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Analytics is not available</p>
                  <p className="mt-1 text-sm text-amber-800">{(error as Error).message}</p>
                  <p className="mt-3 text-xs leading-relaxed text-amber-700">
                    It needs <code className="font-mono">GA4_PROPERTY_ID</code> (the numeric property id, not the G-… measurement id) plus
                    either <code className="font-mono">GA4_REFRESH_TOKEN</code>, issued by <code className="font-mono">scripts/get-ga4-token.mjs</code>,
                    or a service account in <code className="font-mono">GA4_SERVICE_ACCOUNT</code> — stored as Supabase secrets.
                  </p>
                </div>
              </div>
            </div>
          ) : r && derived ? (
            <div key={`${tab}-${r.range.startDate}-${r.range.endDate}-${excludeBots}`} className={`transition-opacity duration-300 ${isFetching ? "opacity-55" : ""}`}>
              {tab === "overview" && <OverviewTab r={r} d={derived} insights={insights} />}
              {tab === "acquisition" && <AcquisitionTab r={r} d={derived} />}
              {tab === "content" && <ContentTab r={r} d={derived} />}
              {tab === "audience" && <AudienceTab r={r} />}
              {tab === "engagement" && <EngagementTab r={r} d={derived} />}
              {tab === "retention" && <RetentionTab r={r} />}
              {tab === "health" && <HealthTab checks={health} />}

              <p className="mt-8 text-[11px] leading-relaxed text-gray-400">
                Generated {new Date(r.generated_at).toLocaleString("en-GB")}{r.cached ? " (cached — reports are kept five minutes to stay inside the GA4 quota)" : ""}.
                {" "}GA4 property time zone: {r.timeZone}; the weekday × hour grid can switch to Korea time.
                {r.quota?.hourRemaining != null && ` GA4 quota left this hour: ${fmtNum(r.quota.hourRemaining)} tokens.`}
                {r.errors.length > 0 && ` ${r.errors.length} report(s) failed — see Data health.`}
              </p>
            </div>
          ) : null}
        </div>

        {drill && <DrillDrawer target={drill} params={params} onClose={() => setDrill(null)} onDrill={setDrill} />}
      </TabContext.Provider>
    </DrillContext.Provider>
  );
}
