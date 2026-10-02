// Unsubscribes the address behind a newsletter's unsubscribe token.
//
//   POST ?token=<uuid>      — RFC 8058 one-click, sent by Gmail/Yahoo's own
//                             "Unsubscribe" button (body: List-Unsubscribe=One-Click)
//   POST { token }          — the site's /unsubscribe page, after the reader confirms
//   GET  ?token=<uuid>      — never unsubscribes: mail scanners prefetch links,
//                             so a GET only forwards to the confirm page
//
// Deploy with --no-verify-jwt: the one-click POST comes from the mail provider
// and carries no Supabase key.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = Deno.env.get("SITE_URL") || "https://koreabylocal.com";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  const url = new URL(req.url);
  let token = url.searchParams.get("token") ?? "";

  if (req.method === "GET") {
    const target = `${SITE_URL}/unsubscribe${UUID.test(token) ? `?token=${token}` : ""}`;
    return new Response(null, { status: 303, headers: { ...cors, Location: target } });
  }
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  if (!token && (req.headers.get("content-type") ?? "").includes("application/json")) {
    try { token = String((await req.json())?.token ?? ""); } catch { /* validated below */ }
  }
  if (!UUID.test(token)) return json({ error: "invalid_token" }, 400);

  const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    db: { schema: "koreabylocal" },
    auth: { persistSession: false },
  });

  const { data: sub, error } = await svc
    .from("subscribers")
    .select("id, status")
    .eq("unsubscribe_token", token)
    .maybeSingle();
  if (error) {
    console.error("newsletter-unsubscribe:", error.message);
    return json({ error: "lookup_failed" }, 500);
  }
  if (!sub) return json({ error: "not_found" }, 404);

  if (sub.status === "active") {
    const { error: updateError } = await svc
      .from("subscribers")
      .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
      .eq("id", sub.id);
    if (updateError) {
      console.error("newsletter-unsubscribe:", updateError.message);
      return json({ error: "update_failed" }, 500);
    }
  }

  // Already unsubscribed (or bounced) is still a success to the reader.
  return json({ success: true });
});
