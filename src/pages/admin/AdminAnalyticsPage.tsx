import { useCallback, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity, AlertTriangle, BarChart3, BookOpen, CalendarRange, CloudOff, Download, FileText, Globe2, HeartPulse, Info, Loader2,
  MousePointerClick, RefreshCw, Repeat, ShieldAlert, Users,
} from "lucide-react";
import { AnalyticsMotionStyles } from "@/components/admin/analytics/motion";
import { DrillContext, TabContext } from "@/components/admin/analytics/context";
import { DrillDrawer } from "@/components/admin/analytics/DrillDrawer";
import { GlossaryDrawer } from "@/components/admin/analytics/GlossaryDrawer";
import { Segmented, Switch } from "@/components/admin/analytics/ui";
import { cleanStart, compareState, derive, findGaps, gapCause, withoutCompare } from "@/components/admin/analytics/derive";
import { buildInsights, type TabKey } from "@/components/admin/analytics/insights";
import { buildHealth } from "@/components/admin/analytics/health";
import { buildSummary } from "@/components/admin/analytics/summary";
import { countryKo, download, fmtDay, fmtNum, fmtPct, fmtRange, ratio, todayIn } from "@/components/admin/analytics/format";
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
 * GA4 for the admin, in plain Korean: what happened, where it came from,
 * what people read and clicked, who they are, whether they come back — a
 * written summary on top, every term explained, and a list of what skews the
 * numbers.
 *
 * Everything comes through the ga4-report edge function (the Data API needs a
 * credential the browser must never see). Filters live in the URL, so a view
 * can be bookmarked or shared.
 */

const TABS: Array<{ key: TabKey; label: string; icon: typeof Activity }> = [
  { key: "overview", label: "개요", icon: BarChart3 },
  { key: "acquisition", label: "유입 경로", icon: Globe2 },
  { key: "content", label: "콘텐츠", icon: FileText },
  { key: "audience", label: "방문자", icon: Users },
  { key: "engagement", label: "클릭·행동", icon: MousePointerClick },
  { key: "retention", label: "재방문", icon: Repeat },
  { key: "realtime", label: "실시간", icon: Activity },
  { key: "health", label: "데이터 점검", icon: HeartPulse },
];

const PRESETS = [
  { value: "7", label: "7일" },
  { value: "14", label: "14일" },
  { value: "28", label: "28일" },
  { value: "90", label: "90일" },
  { value: "180", label: "6개월" },
  { value: "365", label: "1년" },
  { value: "custom", label: "직접 지정" },
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

  const { data: raw, error, isLoading, isFetching } = useAnalyticsReport(params);
  // GA4 allows ten concurrent requests per property. The report runs three
  // batches at a time and realtime six requests, so the header's live count
  // waits for the report unless the realtime tab itself is open.
  const live = useRealtime(tab === "realtime" || !isFetching, tab === "realtime" ? 30_000 : 60_000);

  const [drill, setDrill] = useState<DrillTarget | null>(null);
  const [glossary, setGlossary] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [draft, setDraft] = useState({ start, end });

  // A comparison across a collection gap, or against a period with almost no
  // data, is dropped before anything renders — the tabs then show no ▲▼ at all.
  const gaps = useMemo(() => (raw ? findGaps(raw.daily.current) : []), [raw]);
  const cmp = useMemo(() => (raw ? compareState(raw) : { ok: false, reason: null }), [raw]);
  const r = useMemo(() => (raw ? (cmp.ok ? raw : withoutCompare(raw)) : undefined), [raw, cmp]);
  const derived = useMemo(() => (r ? derive(r) : null), [r]);
  const insights = useMemo(() => (r && derived ? buildInsights(r, derived, gaps) : []), [r, derived, gaps]);
  const health = useMemo(() => (r && derived ? buildHealth(r, derived, gaps) : []), [r, derived, gaps]);
  const summary = useMemo(() => (r && derived ? buildSummary(r, derived, gaps, cmp) : []), [r, derived, gaps, cmp]);
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
    if (!raw) return;
    download(`koreabylocal-ga4-${raw.range.startDate}_${raw.range.endDate}.json`, JSON.stringify(raw, null, 2), "application/json");
  };

  const suspects = raw?.quality.suspects ?? [];
  const botSessions = suspects.reduce((n, s) => n + s.sessions, 0);
  const suspectNames = suspects.map((s) => countryKo(s.countryId ?? "", s.country)).join("·");
  const gapDays = gaps.reduce((n, g) => n + g.days, 0);

  return (
    <DrillContext.Provider value={setDrill}>
      <TabContext.Provider value={(t) => { set({ tab: t === "overview" ? null : t }); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
        <Helmet><title>분석 | Korea By Local Admin</title></Helmet>
        <AnalyticsMotionStyles />

        <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-6 lg:py-8">
          {/* Title */}
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-primary">방문 분석 (GA4)</h1>
              <p className="mt-1 text-sm text-text-secondary">
                koreabylocal.com
                {raw && <> · {fmtRange(raw.range.startDate, raw.range.endDate)}{r?.compare && <span className="text-gray-400"> · 비교: {fmtRange(r.compare.startDate, r.compare.endDate)}</span>}</>}
                {raw && isFetching && <span className="text-gray-400"> · 지난 결과를 보여 주며 최신 데이터를 읽는 중…</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setGlossary(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-primary hover:border-primary/30"
              >
                <BookOpen className="h-3.5 w-3.5 text-accent" /> GA4 용어 쉽게 보기
              </button>
              <button
                type="button"
                onClick={() => set({ tab: "realtime" })}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12px] font-medium text-emerald-800 hover:bg-emerald-100"
              >
                <span className="relative flex h-2 w-2">
                  <span className="ga-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-500" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                {live.data ? `지금 ${fmtNum(live.data.activeUsers)}명 접속 중` : "실시간"}
              </button>
            </div>
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
                <input type="date" value={draft.start} max={draft.end || undefined} onChange={(e) => setDraft((d) => ({ ...d, start: e.target.value }))} className="rounded-lg border border-gray-200 px-2 py-1 text-[12px]" aria-label="시작일" />
                <span className="text-gray-400">~</span>
                <input type="date" value={draft.end} min={draft.start || undefined} onChange={(e) => setDraft((d) => ({ ...d, end: e.target.value }))} className="rounded-lg border border-gray-200 px-2 py-1 text-[12px]" aria-label="종료일" />
                <button type="submit" className="rounded-lg bg-primary px-2.5 py-1 text-[12px] font-medium text-white hover:bg-primary/90">적용</button>
              </form>
            )}
            <label className="flex items-center gap-1.5 text-[12px] text-gray-600">
              <span className="sr-only sm:not-sr-only">비교</span>
              <select
                value={compare}
                onChange={(e) => set({ compare: e.target.value === "previous" ? null : e.target.value })}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[12px] font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/10"
              >
                <option value="previous">바로 앞 기간과</option>
                <option value="year">작년 같은 주와</option>
                <option value="none">비교 안 함</option>
              </select>
            </label>
            <Switch
              checked={excludeBots}
              onChange={(v) => set({ bots: v ? null : "all" })}
              label={<>봇 의심 제외{suspects.length > 0 && <span className="ml-1 rounded-full bg-gray-100 px-1.5 text-[10.5px] text-gray-500">{suspects.length}개국</span>}</>}
              hint="방문은 많은데 거의 머물지 않는 나라(크롤러·광고 사기 프로그램)를 숫자에서 뺍니다."
            />
            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={onExport}
                disabled={!raw}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[12px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                title="전체 보고서를 JSON 파일로 내려받기"
              >
                <Download className="h-3.5 w-3.5" /> 내보내기
              </button>
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing || isFetching}
                className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                title="새로고침 (5분 저장본을 건너뛰고 GA4에서 다시 읽기)"
                aria-label="새로고침"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing || isFetching ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* What the numbers include — and what they can't */}
          {raw && tab !== "realtime" && (
            <div className="mb-4 space-y-2">
              {gapDays > 0 && (
                <div className="ga-fade flex flex-wrap items-start gap-x-3 gap-y-1 rounded-xl bg-amber-50 px-4 py-2.5 text-[12px] text-amber-900">
                  <CloudOff className="mt-px h-4 w-4 shrink-0" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <strong>GA4 수집 공백 {gapDays}일:</strong>{" "}
                    {gaps.map((g) => `${fmtDay(g.start)} ~ ${fmtDay(g.end)}`).join(", ")}에는 사이트가 GA4로 데이터를 보내지 못했습니다{gapCause(gaps[0]) ? ` (${gapCause(gaps[0])})` : ""}.
                    이 기간이 들어간 합계는 실제보다 작고, 차트에는 회색으로 표시됩니다.
                  </span>
                  {cleanStart(gaps) && (
                    <button
                      type="button"
                      onClick={() => {
                        const from = cleanStart(gaps)!;
                        setDraft({ start: from, end: raw.range.endDate });
                        set({ range: "custom", start: from, end: raw.range.endDate });
                      }}
                      className="font-semibold underline-offset-2 hover:underline"
                    >
                      {fmtDay(cleanStart(gaps)!)}부터만 보기
                    </button>
                  )}
                </div>
              )}
              {!cmp.ok && cmp.reason && (
                <div className="ga-fade flex items-start gap-3 rounded-xl bg-slate-100/80 px-4 py-2.5 text-[12px] text-slate-700">
                  <Info className="mt-px h-4 w-4 shrink-0" aria-hidden />
                  <span>증감(▲▼)을 표시하지 않습니다 — {cmp.reason}</span>
                </div>
              )}
              {suspects.length > 0 && (
                <div className={`ga-fade flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-4 py-2.5 text-[12px] ${excludeBots ? "bg-indigo-50/70 text-indigo-900" : "bg-red-50 text-[#8f1d1d]"}`}>
                  <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden />
                  {excludeBots ? (
                    <span>
                      <strong>봇 의심 방문 제외 중:</strong> {suspectNames} — {fmtNum(botSessions)}회, 전체 방문의 {fmtPct(ratio(botSessions, botSessions + raw.totals.current.sessions), 0)}. 거의 머물지 않아 사람이 아닌 것으로 봅니다.
                    </span>
                  ) : (
                    <span>
                      <strong>봇 의심 방문 포함 중:</strong> {suspectNames}에서 온 {fmtNum(botSessions)}회({fmtPct(ratio(botSessions, raw.totals.current.sessions), 0)})가 모든 비율을 실제보다 나쁘게 만듭니다.
                    </span>
                  )}
                  <button type="button" onClick={() => set({ bots: excludeBots ? "all" : null })} className="ml-auto font-semibold underline-offset-2 hover:underline">
                    {excludeBots ? "봇 포함해서 보기" : "봇 빼고 보기"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tabs */}
          <nav className="sticky top-0 z-30 -mx-4 mb-5 border-b border-gray-200 bg-[#fafaf8]/90 px-4 backdrop-blur lg:-mx-6 lg:px-6" aria-label="분석 화면">
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
              <div className="ga-shimmer h-[150px] rounded-2xl" />
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {Array.from({ length: 8 }, (_, i) => <div key={i} className="ga-shimmer h-[132px] rounded-2xl" />)}
              </div>
              <p className="flex items-center justify-center gap-2 text-[12px] text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" /> GA4에서 보고서 약 30개를 읽는 중…
              </p>
            </div>
          ) : error && !raw ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">분석 데이터를 불러오지 못했습니다</p>
                  <p className="mt-1 text-sm text-amber-800">{(error as Error).message}</p>
                  <p className="mt-3 text-xs leading-relaxed text-amber-700">
                    Supabase 비밀값에 <code className="font-mono">GA4_PROPERTY_ID</code>(숫자로 된 속성 ID)와{" "}
                    <code className="font-mono">GA4_REFRESH_TOKEN</code>(scripts/get-ga4-token.mjs로 발급) 또는{" "}
                    <code className="font-mono">GA4_SERVICE_ACCOUNT</code>가 있어야 합니다.
                  </p>
                </div>
              </div>
            </div>
          ) : r && derived ? (
            <div key={`${tab}-${r.range.startDate}-${r.range.endDate}-${excludeBots}`} className={`transition-opacity duration-300 ${isFetching ? "opacity-55" : ""}`}>
              {tab === "overview" && <OverviewTab r={r} d={derived} insights={insights} summary={summary} gaps={gaps} />}
              {tab === "acquisition" && <AcquisitionTab r={r} d={derived} />}
              {tab === "content" && <ContentTab r={r} d={derived} />}
              {tab === "audience" && <AudienceTab r={r} />}
              {tab === "engagement" && <EngagementTab r={r} d={derived} />}
              {tab === "retention" && <RetentionTab r={r} />}
              {tab === "health" && <HealthTab checks={health} />}

              <p className="mt-8 text-[11px] leading-relaxed text-gray-400">
                {new Date(r.generated_at).toLocaleString("ko-KR")}에 GA4에서 읽음{r.cached ? " (같은 조건은 5분간 저장본을 보여 줍니다)" : ""}.
                {" "}GA4 속성 시간대는 {r.timeZone}이고, 요일×시간 표는 한국 시간으로 바꿔 볼 수 있습니다. koreabylocal.com 방문만 셉니다.
                {r.quota?.hourRemaining != null && ` 이번 시간 GA4 조회 한도 ${fmtNum(r.quota.hourRemaining)} 토큰 남음.`}
                {r.errors.length > 0 && ` 보고서 ${r.errors.length}개를 불러오지 못했습니다 — 데이터 점검 탭 참고.`}
              </p>
            </div>
          ) : null}
        </div>

        {drill && (
          <DrillDrawer
            target={drill}
            params={params}
            onClose={() => setDrill(null)}
            onDrill={setDrill}
            compareOk={cmp.ok}
            gaps={gaps.map((g) => ({ from: g.from, to: g.to }))}
            endsToday={Boolean(raw && raw.range.endDate === todayIn(raw.timeZone))}
          />
        )}
        {glossary && <GlossaryDrawer onClose={() => setGlossary(false)} />}
      </TabContext.Provider>
    </DrillContext.Provider>
  );
}
