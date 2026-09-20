// Reads the site's GA4 metrics for the admin dashboard. Admin-only.
//
// The measurement ID the site ships with (G-…) cannot read reports — the Data
// API needs a service account, and a service-account key cannot go in
// front-end code. So the browser asks this function, which holds the key.
//
// REQUIRED secrets: GA4_PROPERTY_ID (the NUMERIC property id, not G-…),
// GA4_SERVICE_ACCOUNT (the downloaded JSON, whole).
//
// The service account's email must also be added to the GA4 property as a
// Viewer — Admin → Property access management. Forgetting that is the usual
// cause of a 403, so it is reported in those words rather than as a raw error.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAccessToken, readServiceAccount } from "../_shared/google-auth.ts";

const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const API = "https://analyticsdata.googleapis.com/v1beta";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const dim = (name: string) => ({ name });
const met = (name: string) => ({ name });
const byMetric = (name: string) => [{ metric: { metricName: name }, desc: true }];

interface GaRow {
  dimensionValues?: Array<{ value?: string }>;
  metricValues?: Array<{ value?: string }>;
}
interface GaReport {
  rows?: GaRow[];
}

/** Flattens GA4's parallel dimension/metric arrays into plain objects. */
function flatten(report: GaReport | undefined, dims: string[], mets: string[]) {
  return (report?.rows ?? []).map((r) => {
    const out: Record<string, string | number> = {};
    dims.forEach((d, i) => { out[d] = r.dimensionValues?.[i]?.value ?? ""; });
    mets.forEach((m, i) => { out[m] = Number(r.metricValues?.[i]?.value ?? 0); });
    return out;
  });
}

const SUMMARY_METRICS = [
  "activeUsers", "newUsers", "sessions", "screenPageViews",
  "bounceRate", "averageSessionDuration", "engagementRate",
  "engagedSessions", "screenPageViewsPerSession", "eventCount",
];

function buildRequests(days: number) {
  // `${days}daysAgo`–today spans days+1 days, which would make the current
  // period one day longer than the one it is compared against.
  const range = { startDate: `${days - 1}daysAgo`, endDate: "today" };
  const previous = { startDate: `${days * 2 - 1}daysAgo`, endDate: `${days}daysAgo` };

  return [
    // Both ranges in one request, so the comparison needs no second round trip.
    // GA4 allows ten metrics per request, which is exactly what this uses.
    { dateRanges: [range, previous], metrics: SUMMARY_METRICS.map(met) },
    {
      dateRanges: [range],
      dimensions: [dim("date")],
      metrics: [met("activeUsers"), met("sessions"), met("screenPageViews")],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    },
    {
      dateRanges: [range],
      dimensions: [dim("pagePath"), dim("pageTitle")],
      metrics: [met("screenPageViews"), met("activeUsers")],
      orderBys: byMetric("screenPageViews"),
      limit: 15,
    },
    {
      dateRanges: [range],
      dimensions: [dim("sessionDefaultChannelGroup")],
      metrics: [met("sessions"), met("activeUsers"), met("engagementRate")],
      orderBys: byMetric("sessions"),
      limit: 12,
    },
    {
      dateRanges: [range],
      dimensions: [dim("sessionSource"), dim("sessionMedium")],
      metrics: [met("sessions"), met("activeUsers")],
      orderBys: byMetric("sessions"),
      limit: 15,
    },
    {
      dateRanges: [range],
      dimensions: [dim("country")],
      metrics: [met("activeUsers"), met("sessions")],
      orderBys: byMetric("activeUsers"),
      limit: 15,
    },
    {
      dateRanges: [range],
      dimensions: [dim("deviceCategory")],
      metrics: [met("activeUsers"), met("sessions")],
      orderBys: byMetric("activeUsers"),
    },
    {
      dateRanges: [range],
      dimensions: [dim("landingPage")],
      metrics: [met("sessions"), met("bounceRate")],
      orderBys: byMetric("sessions"),
      limit: 12,
    },
    {
      dateRanges: [range],
      dimensions: [dim("eventName")],
      metrics: [met("eventCount"), met("activeUsers")],
      orderBys: byMetric("eventCount"),
      limit: 12,
    },
  ];
}

async function call(url: string, token: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
  if (res.ok) return await res.json();

  const detail = (await res.text().catch(() => "")).slice(0, 300);
  // These two have one cause each and a clear fix, so say the fix.
  if (res.status === 403) {
    throw new Error(
      "GA4 refused access. Add the service account's email to the GA4 property as a Viewer (Admin → Property access management).",
    );
  }
  if (res.status === 404) {
    throw new Error("GA4 property not found. GA4_PROPERTY_ID must be the numeric property id, not the G-… measurement id.");
  }
  throw new Error(`GA4 error ${res.status}: ${detail}`);
}

// GA4 quota is per property, and the dashboard is re-opened far more often than
// the numbers change. A short cache keeps a browsing admin off the quota.
const CACHE_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; payload: unknown }>();

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
  if (!propertyId || !account) {
    return json({
      error: "not_configured",
      detail: "Set GA4_PROPERTY_ID (numeric) and GA4_SERVICE_ACCOUNT (the JSON key file) as Supabase secrets.",
    }, 503);
  }

  let body: { days?: number; refresh?: boolean } = {};
  try { body = await req.json(); } catch { /* defaults */ }
  const allowed = [7, 28, 90, 365];
  const days = allowed.includes(Number(body.days)) ? Number(body.days) : 28;

  const key = `${propertyId}:${days}`;
  const hit = cache.get(key);
  if (hit && !body.refresh && Date.now() - hit.at < CACHE_MS) {
    return json({ ...(hit.payload as object), cached: true });
  }

  try {
    const token = await getAccessToken(account, SCOPE);

    const [batch, realtime] = await Promise.all([
      call(`${API}/properties/${propertyId}:batchRunReports`, token, { requests: buildRequests(days) }),
      // Realtime is a separate endpoint and deliberately not cached with the
      // rest — "who is on the site now" is the one number that must be now.
      call(`${API}/properties/${propertyId}:runRealtimeReport`, token, {
        dimensions: [dim("unifiedScreenName")],
        metrics: [met("activeUsers")],
        orderBys: byMetric("activeUsers"),
        limit: 10,
      }).catch(() => null),
    ]);

    const r = (batch.reports ?? []) as GaReport[];
    const totals = (r[0]?.rows?.[0]?.metricValues ?? []).map((v) => Number(v.value ?? 0));
    const prevTotals = (r[0]?.rows?.[1]?.metricValues ?? []).map((v) => Number(v.value ?? 0));

    const summary: Record<string, { value: number; previous: number }> = {};
    SUMMARY_METRICS.forEach((name, i) => {
      summary[name] = { value: totals[i] ?? 0, previous: prevTotals[i] ?? 0 };
    });

    const payload = {
      success: true,
      days,
      generated_at: new Date().toISOString(),
      summary,
      daily: flatten(r[1], ["date"], ["activeUsers", "sessions", "screenPageViews"]),
      pages: flatten(r[2], ["pagePath", "pageTitle"], ["screenPageViews", "activeUsers"]),
      channels: flatten(r[3], ["channel"], ["sessions", "activeUsers", "engagementRate"]),
      sources: flatten(r[4], ["source", "medium"], ["sessions", "activeUsers"]),
      countries: flatten(r[5], ["country"], ["activeUsers", "sessions"]),
      devices: flatten(r[6], ["device"], ["activeUsers", "sessions"]),
      landing: flatten(r[7], ["landingPage"], ["sessions", "bounceRate"]),
      events: flatten(r[8], ["eventName"], ["eventCount", "activeUsers"]),
      realtime: {
        activeUsers: (realtime?.rows ?? []).reduce(
          (n: number, row: GaRow) => n + Number(row.metricValues?.[0]?.value ?? 0), 0,
        ),
        screens: flatten(realtime ?? undefined, ["screen"], ["activeUsers"]),
      },
    };

    cache.set(key, { at: Date.now(), payload });
    return json(payload);
  } catch (e) {
    const message = (e as Error).message;
    console.error("ga4-report:", message);
    return json({ error: "ga4_failed", detail: message }, 502);
  }
});
