import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { DrillReport, DrillTarget, RangeParams, Realtime, Report } from "./types";

/**
 * Everything is read through the ga4-report edge function: the Data API needs
 * a credential that must never reach the browser.
 */
async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("ga4-report", { body });
  if (error) {
    let detail = error.message;
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx) {
        const b = await ctx.json();
        detail = b?.detail ?? b?.error ?? detail;
      }
    } catch { /* keep the original message */ }
    throw new Error(detail);
  }
  return data as T;
}

const rangeBody = (p: RangeParams) =>
  p.start && p.end
    ? { start: p.start, end: p.end, compare: p.compare, excludeBots: p.excludeBots }
    : { days: p.days ?? 28, compare: p.compare, excludeBots: p.excludeBots };

export const reportKey = (p: RangeParams) => ["ga4", "report", rangeBody(p)];

export function useAnalyticsReport(p: RangeParams) {
  return useQuery<Report>({
    queryKey: reportKey(p),
    queryFn: () => invoke<Report>({ mode: "report", ...rangeBody(p) }),
    staleTime: 5 * 60 * 1000,
    retry: false,
    // Refetch keeps the frame: the last report stays on screen, dimmed.
    placeholderData: keepPreviousData,
  });
}

/** Refreshing skips the function's five-minute cache. */
export const refreshReport = (p: RangeParams) => invoke<Report>({ mode: "report", ...rangeBody(p), refresh: true });

export function useRealtime(enabled = true, intervalMs = 30_000) {
  return useQuery<Realtime>({
    queryKey: ["ga4", "realtime"],
    queryFn: () => invoke<Realtime>({ mode: "realtime" }),
    enabled,
    refetchInterval: intervalMs,
    refetchIntervalInBackground: false,
    staleTime: 15_000,
    retry: false,
  });
}

export function useDrill(target: DrillTarget | null, p: RangeParams) {
  return useQuery<DrillReport>({
    queryKey: ["ga4", "drill", target?.dimension, target?.value, rangeBody(p)],
    queryFn: () => invoke<DrillReport>({ mode: "drill", drill: { dimension: target!.dimension, value: target!.value }, ...rangeBody(p) }),
    enabled: Boolean(target),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
