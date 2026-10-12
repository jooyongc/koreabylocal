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

// GA4 takes about five seconds to build a report, every time the page opens.
// The last report this browser saw for the same filters is shown at once —
// dimmed while the fresh one loads — instead of five seconds of placeholders.
const SAVED_KEY = "kbl-admin-ga4-report";
const SAVED_MAX_AGE_MS = 24 * 3600 * 1000;
const SAVED_ENTRIES = 4; // a 1-year report is ~300 KB

type Saved = Record<string, { at: number; data: Report }>;

function readSaved(): Saved {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) ?? "{}") as Saved;
  } catch {
    return {};
  }
}

function savedReport(id: string) {
  const hit = readSaved()[id];
  return hit && Date.now() - hit.at < SAVED_MAX_AGE_MS ? hit : undefined;
}

function saveReport(id: string, data: Report) {
  try {
    const kept = Object.entries(readSaved())
      .filter(([key]) => key !== id)
      .sort((a, b) => b[1].at - a[1].at)
      .slice(0, SAVED_ENTRIES - 1);
    // Dated by when GA4 produced it: the function may answer from its cache.
    const at = Date.parse(data.generated_at) || Date.now();
    localStorage.setItem(SAVED_KEY, JSON.stringify({ [id]: { at, data }, ...Object.fromEntries(kept) }));
  } catch {
    /* storage full or blocked: the page still works, without the head start */
  }
}

const savedId = (p: RangeParams) => JSON.stringify(rangeBody(p));

export function useAnalyticsReport(p: RangeParams) {
  const id = savedId(p);
  return useQuery<Report>({
    queryKey: reportKey(p),
    queryFn: async () => {
      const report = await invoke<Report>({ mode: "report", ...rangeBody(p) });
      saveReport(id, report);
      return report;
    },
    // A saved report younger than staleTime is used as is; an older one is
    // shown while the query fetches a fresh one.
    initialData: () => savedReport(id)?.data,
    initialDataUpdatedAt: () => savedReport(id)?.at,
    staleTime: 5 * 60 * 1000,
    retry: false,
    // Refetch keeps the frame: the last report stays on screen, dimmed.
    placeholderData: keepPreviousData,
  });
}

/** Refreshing skips the function's five-minute cache. */
export const refreshReport = async (p: RangeParams) => {
  const report = await invoke<Report>({ mode: "report", ...rangeBody(p), refresh: true });
  saveReport(savedId(p), report);
  return report;
};

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
