// Reads the site's GA4 data for the admin analytics page. Admin-only.
//
// The measurement ID the site ships with (G-…) cannot read reports, and a
// credential that can must not reach the browser, so the browser asks this
// function, which holds it.
//
// REQUIRED secret: GA4_PROPERTY_ID (the NUMERIC property id, not G-…).
//
// Then one of two ways to authenticate, tried in this order:
//
//   GA4_REFRESH_TOKEN — an OAuth token from someone who can already see the
//     property, issued by scripts/get-ga4-token.mjs against the same Google
//     client the site's Gmail sending uses. Nothing to create, nobody to grant.
//   GA4_SERVICE_ACCOUNT — the downloaded JSON key, whole. Its email must also
//     be added to the property as a Viewer (Admin → Property access
//     management); forgetting that is the usual cause of a 403, so it is
//     reported in those words rather than as a raw status.
//
// Three modes (body.mode):
//   "report"   (default) every report the dashboard renders, for one range
//   "drill"    one page / channel / source / campaign / country / device / event
//   "realtime" the last 30 minutes; polled by the page, cached only briefly
//
// Report requests and their shaping live in reports.ts.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAccessToken, getAccessTokenFromRefreshToken, readServiceAccount } from "../_shared/google-auth.ts";
import * as R from "./reports.ts";

const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const API = "https://analyticsdata.googleapis.com/v1beta";
const ADMIN_API = "https://analyticsadmin.googleapis.com/v1beta";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

class GaError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

async function call(url: string, token: string, body?: unknown) {
  const res = await fetch(url, {
    method: body === undefined ? "GET" : "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(25_000),
  });
  if (res.ok) return await res.json();

  const detail = (await res.text().catch(() => "")).slice(0, 300);
  // These two have one cause each and a clear fix, so say the fix.
  if (res.status === 403) {
    throw new GaError(
      "GA4 refused access. Add the service account's email to the GA4 property as a Viewer (Admin → Property access management).",
      403,
    );
  }
  if (res.status === 404) {
    throw new GaError("GA4 property not found. GA4_PROPERTY_ID must be the numeric property id, not the G-… measurement id.", 404);
  }
  throw new GaError(`GA4 error ${res.status}: ${detail}`, res.status);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Quota and concurrency errors clear up within seconds; try once more. */
async function callRetrying(url: string, token: string, body?: unknown) {
  try {
    return await call(url, token, body);
  } catch (e) {
    const status = (e as GaError).status ?? 0;
    if (status !== 429 && status < 500) throw e;
    await sleep(1500);
    return await call(url, token, body);
  }
}

/**
 * Runs report specs as batchRunReports calls (at most five reports each),
 * three calls at a time — GA4 allows ten concurrent requests per property and
 * the page may be polling realtime alongside. If a batch fails, its reports
 * are retried one by one so one bad report costs one panel, not the page.
 */
async function runSpecs(propertyId: string, token: string, specs: R.ReportSpec[]) {
  const reports: Record<string, R.GaReport | undefined> = {};
  const errors: Array<{ report: string; message: string }> = [];
  const batches: R.ReportSpec[][] = [];
  for (let i = 0; i < specs.length; i += 5) batches.push(specs.slice(i, i + 5));

  const runBatch = async (batch: R.ReportSpec[]) => {
    try {
      const res = await callRetrying(`${API}/properties/${propertyId}:batchRunReports`, token, {
        requests: batch.map((s) => s.body),
      });
      batch.forEach((s, i) => { reports[s.key] = res.reports?.[i]; });
    } catch (e) {
      if ((e as GaError).status === 403 || (e as GaError).status === 404) throw e;
      for (const s of batch) {
        try {
          reports[s.key] = await callRetrying(`${API}/properties/${propertyId}:runReport`, token, s.body);
        } catch (one) {
          errors.push({ report: s.key, message: (one as Error).message });
        }
      }
    }
  };

  for (let i = 0; i < batches.length; i += 3) await Promise.all(batches.slice(i, i + 3).map(runBatch));
  return { reports, errors };
}

// The property's time zone decides what "today" and "hour" mean in every
// report. It practically never changes, so it is read once per instance.
let zone: { tz: string; at: number } | null = null;
async function propertyTimeZone(propertyId: string, token: string) {
  if (zone && Date.now() - zone.at < 6 * 3600e3) return zone.tz;
  try {
    const p = await call(`${ADMIN_API}/properties/${propertyId}`, token);
    zone = { tz: p.timeZone || "UTC", at: Date.now() };
  } catch {
    zone = { tz: "UTC", at: Date.now() };
  }
  return zone.tz;
}

// GA4 quota is per property, and the dashboard is re-opened far more often than
// the numbers change. A short cache keeps a browsing admin off the quota.
// Realtime is the exception — "who is on the site now" has to be now.
const REPORT_CACHE_MS = 5 * 60 * 1000;
const REALTIME_CACHE_MS = 30 * 1000;
const cache = new Map<string, { at: number; payload: unknown }>();

function remember(key: string, payload: unknown) {
  cache.set(key, { at: Date.now(), payload });
  if (cache.size > 60) cache.delete(cache.keys().next().value!);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const svc = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { db: { schema: "koreabylocal" }, auth: { persistSession: false } },
  );

  // Checked before the cache: a cached report must not become readable to
  // someone who is not an admin.
  const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  if (!jwt) return json({ error: "unauthorized" }, 401);
  const { data: u } = await svc.auth.getUser(jwt);
  if (!u?.user) return json({ error: "unauthorized" }, 401);
  const { data: prof } = await svc.from("profiles").select("role").eq("id", u.user.id).maybeSingle();
  if (prof?.role !== "admin") return json({ error: "forbidden" }, 403);

  const propertyId = Deno.env.get("GA4_PROPERTY_ID");
  const account = readServiceAccount(Deno.env.get("GA4_SERVICE_ACCOUNT"));
  const refreshToken = Deno.env.get("GA4_REFRESH_TOKEN");
  const clientId = Deno.env.get("GMAIL_CLIENT_ID");
  const clientSecret = Deno.env.get("GMAIL_CLIENT_SECRET");
  const canRefresh = Boolean(refreshToken && clientId && clientSecret);

  if (!propertyId || (!account && !canRefresh)) {
    return json({
      error: "not_configured",
      detail: "Set GA4_PROPERTY_ID (the numeric property id) and either GA4_REFRESH_TOKEN or GA4_SERVICE_ACCOUNT as Supabase secrets.",
    }, 503);
  }

  let body: {
    mode?: string; days?: number; start?: string; end?: string; compare?: string;
    excludeBots?: boolean; refresh?: boolean; drill?: { dimension?: string; value?: string };
  } = {};
  try { body = await req.json(); } catch { /* defaults */ }
  const mode = body.mode === "realtime" || body.mode === "drill" ? body.mode : "report";

  let drill: { dimension: string; value: string } | undefined;
  if (mode === "drill") {
    const dimension = String(body.drill?.dimension ?? "");
    const value = String(body.drill?.value ?? "");
    if (!R.DRILL_DIMENSIONS.includes(dimension) || !value || value.length > 500) {
      return json({ error: "bad_request", detail: `drill.dimension must be one of ${R.DRILL_DIMENSIONS.join(", ")}` }, 400);
    }
    drill = { dimension, value };
  }

  try {
    // The refresh token is preferred: it belongs to a person who already has
    // access, so there is nothing to grant and nothing extra to go stale.
    const token = canRefresh
      ? await getAccessTokenFromRefreshToken(clientId!, clientSecret!, refreshToken!)
      : await getAccessToken(account!, SCOPE);

    if (mode === "realtime") {
      const key = `rt:${propertyId}`;
      const hit = cache.get(key);
      if (hit && Date.now() - hit.at < REALTIME_CACHE_MS) return json({ ...(hit.payload as object), cached: true });
      const reports: Record<string, R.GaReport | undefined> = {};
      await Promise.all(R.REALTIME_SPECS.map(async (s) => {
        reports[s.key] = await callRetrying(`${API}/properties/${propertyId}:runRealtimeReport`, token, s.body).catch(() => undefined);
      }));
      const payload = { success: true, mode, generated_at: new Date().toISOString(), ...R.shapeRealtime(reports) };
      remember(key, payload);
      return json(payload);
    }

    const tz = await propertyTimeZone(propertyId, token);
    const today = R.todayIn(tz);
    const ranges = R.resolveRanges(body, today);
    if ("error" in ranges) return json({ error: "bad_request", detail: ranges.error }, 400);

    // Bots are left out by default; the page can ask for all traffic.
    const excludeBots = body.excludeBots !== false;
    const key = JSON.stringify([propertyId, mode, ranges.current, ranges.compare, excludeBots, drill ?? null]);
    const hit = cache.get(key);
    if (hit && !body.refresh && Date.now() - hit.at < REPORT_CACHE_MS) {
      return json({ ...(hit.payload as object), cached: true });
    }

    // Which countries look like bots is decided from this range's own data,
    // before the real reports run, so every report leaves out the same set.
    const q = await runSpecs(propertyId, token, [R.qualitySpec(ranges)]);
    const suspects = R.suspectCountries(q.reports.quality);
    const scope: R.Scope = { excludeCountries: excludeBots ? suspects.map((s) => s.country) : [], hosts: R.LIVE_HOSTS, drill };

    const weeks = R.cohortWeeks(today);
    const specs = mode === "drill" ? R.drillReports(ranges, scope) : R.mainReports(ranges, scope, weeks);
    const { reports, errors } = await runSpecs(propertyId, token, specs);

    const payload = {
      success: true,
      mode,
      generated_at: new Date().toISOString(),
      drill: drill ?? null,
      quality: { excluded: excludeBots, suspects },
      errors: [...q.errors, ...errors],
      ...(mode === "drill" ? R.shapeDrill(reports, ranges) : R.shapeMain(reports, ranges, tz, weeks)),
    };
    remember(key, payload);
    return json(payload);
  } catch (e) {
    const message = (e as Error).message;
    console.error("ga4-report:", message);
    return json({ error: "ga4_failed", detail: message }, 502);
  }
});
