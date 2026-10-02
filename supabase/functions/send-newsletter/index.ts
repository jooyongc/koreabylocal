// Sends a newsletter campaign from /admin/subscribers. Admin-only.
//
//   { action: "test", campaign_id }  → one copy to the admin who asked, "[TEST]" subject
//   { action: "send", campaign_id }  → queues every active subscriber on the
//     first call, then sends the next batch of the queue. The admin page calls
//     it again until nothing is pending.
//
// Batches keep each call short, and the queue (newsletter_deliveries) makes a
// big list resumable: the site's Gmail account caps how many messages go out a
// day, so sending stops at NEWSLETTER_DAILY_LIMIT over a rolling 24h and picks
// up where it left off the next time someone presses Send.
//
// Optional secrets: NEWSLETTER_DAILY_LIMIT (default 400 — under a personal
// Gmail account's ~500/day, leaving room for welcome and reply emails),
// NEWSLETTER_BATCH_SIZE (default 25), NEWSLETTER_POSTAL_ADDRESS, SITE_URL.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GMAIL_SENDER, isMailConfigured, sendMail } from "../_shared/gmail.ts";
import { remainingToday, renderNewsletter, unsubscribeHeaders } from "../_shared/newsletter.ts";

const SITE_URL = Deno.env.get("SITE_URL") || "https://koreabylocal.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const DAILY_LIMIT = Number(Deno.env.get("NEWSLETTER_DAILY_LIMIT")) || 400;
const BATCH_SIZE = Number(Deno.env.get("NEWSLETTER_BATCH_SIZE")) || 25;
const POSTAL_ADDRESS = Deno.env.get("NEWSLETTER_POSTAL_ADDRESS") || null;
const CONCURRENCY = 3;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

interface Campaign {
  id: number;
  subject: string;
  preheader: string | null;
  body_html: string;
  status: "draft" | "sending" | "sent";
}

// deno-lint-ignore no-explicit-any
type Svc = any;

function render(campaign: Campaign, token: string | null) {
  const unsubscribeUrl = token
    ? `${SITE_URL}/unsubscribe?token=${token}`
    : `${SITE_URL}/unsubscribe`;
  return renderNewsletter({
    bodyHtml: campaign.body_html,
    preheader: campaign.preheader,
    unsubscribeUrl,
    siteUrl: SITE_URL,
    postalAddress: POSTAL_ADDRESS,
  });
}

/** Queues every active subscriber once. Safe to repeat: (campaign, subscriber) is unique. */
async function enqueue(svc: Svc, campaignId: number): Promise<void> {
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await svc
      .from("subscribers")
      .select("id, email")
      .eq("status", "active")
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`load subscribers: ${error.message}`);
    if (!data?.length) break;

    const rows = data.map((s: { id: number; email: string }) => ({
      campaign_id: campaignId,
      subscriber_id: s.id,
      email: s.email,
    }));
    const { error: insertError } = await svc
      .from("newsletter_deliveries")
      .upsert(rows, { onConflict: "campaign_id,subscriber_id", ignoreDuplicates: true });
    if (insertError) throw new Error(`queue deliveries: ${insertError.message}`);
    if (data.length < PAGE) break;
  }
}

async function countDeliveries(svc: Svc, campaignId: number, status: string): Promise<number> {
  const { count } = await svc
    .from("newsletter_deliveries")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .eq("status", status);
  return count ?? 0;
}

/** Gmail said "not now" (rate or daily quota) rather than "this address is bad". */
const isQuotaError = (status: number, error: string) =>
  status === 429 || (status === 403 && /limit|quota|rate/i.test(error));

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const svc = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    db: { schema: "koreabylocal" },
    auth: { persistSession: false },
  });

  const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  if (!jwt) return json({ error: "unauthorized" }, 401);
  const { data: u } = await svc.auth.getUser(jwt);
  if (!u?.user) return json({ error: "unauthorized" }, 401);
  const { data: prof } = await svc.from("profiles").select("role").eq("id", u.user.id).maybeSingle();
  if (prof?.role !== "admin") return json({ error: "forbidden" }, 403);

  if (!isMailConfigured()) return json({ error: "email_not_configured" }, 503);

  let body: { action?: string; campaign_id?: number } = {};
  try { body = await req.json(); } catch { /* validated below */ }
  const campaignId = Number(body.campaign_id);
  if (!campaignId) return json({ error: "missing_campaign_id" }, 400);

  const { data: campaign } = await svc
    .from("newsletter_campaigns")
    .select("id, subject, preheader, body_html, status")
    .eq("id", campaignId)
    .maybeSingle() as { data: Campaign | null };
  if (!campaign) return json({ error: "campaign_not_found" }, 404);
  if (!campaign.subject.trim() || !campaign.body_html.replace(/<[^>]*>/g, "").trim()) {
    return json({ error: "campaign_empty" }, 400);
  }

  // ── test: one copy to the admin ────────────────────────────────────────────
  if (body.action === "test") {
    const to = u.user.email;
    if (!to) return json({ error: "admin_has_no_email" }, 400);
    const sent = await sendMail({
      to,
      subject: `[TEST] ${campaign.subject}`,
      html: render(campaign, null),
    });
    return sent.ok ? json({ success: true, to }) : json({ error: sent.error }, 502);
  }

  if (body.action !== "send") return json({ error: "unknown_action" }, 400);
  if (campaign.status === "sent") return json({ success: true, done: true, pending: 0 });

  // ── send: queue on the first call, then work through the queue ─────────────
  try {
    if (campaign.status === "draft") {
      await enqueue(svc, campaignId);
      const recipients = await countDeliveries(svc, campaignId, "pending");
      await svc
        .from("newsletter_campaigns")
        .update({ status: "sending", started_at: new Date().toISOString(), recipient_count: recipients })
        .eq("id", campaignId)
        .eq("status", "draft");
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: sentLast24h } = await svc
      .from("newsletter_deliveries")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent")
      .gte("sent_at", since);
    const allowance = Math.min(BATCH_SIZE, remainingToday(sentLast24h ?? 0, DAILY_LIMIT));

    let sentNow = 0;
    let failedNow = 0;
    let stopReason: string | null = allowance === 0 ? "daily_limit" : null;

    if (allowance > 0) {
      const { data: batch, error: batchError } = await svc
        .from("newsletter_deliveries")
        .select("id, email, subscribers(unsubscribe_token, status)")
        .eq("campaign_id", campaignId)
        .eq("status", "pending")
        .order("id")
        .limit(allowance);
      if (batchError) throw new Error(`load batch: ${batchError.message}`);

      const queue = [...(batch ?? [])];
      const worker = async () => {
        while (queue.length > 0 && !stopReason) {
          const d = queue.shift()!;
          // Many-to-one embeds come back as an object; tolerate the array shape too.
          const embedded: unknown = d.subscribers;
          const sub = (Array.isArray(embedded) ? embedded[0] : embedded) as
            | { unsubscribe_token: string; status: string }
            | null;

          // Unsubscribed (or bounced) after the campaign was queued.
          if (!sub || sub.status !== "active") {
            await svc.from("newsletter_deliveries").update({ status: "skipped" }).eq("id", d.id);
            continue;
          }

          const oneClick = `${SUPABASE_URL}/functions/v1/newsletter-unsubscribe?token=${sub.unsubscribe_token}`;
          const result = await sendMail({
            to: d.email,
            subject: campaign.subject,
            html: render(campaign, sub.unsubscribe_token),
            headers: unsubscribeHeaders(oneClick, GMAIL_SENDER || null),
          });

          if (result.ok) {
            sentNow++;
            await svc
              .from("newsletter_deliveries")
              .update({ status: "sent", sent_at: new Date().toISOString(), error: null })
              .eq("id", d.id);
          } else if (isQuotaError(result.status, result.error)) {
            // Leave it pending; the next run retries it.
            stopReason = "gmail_limit";
          } else {
            failedNow++;
            await svc
              .from("newsletter_deliveries")
              .update({ status: "failed", error: result.error.slice(0, 500) })
              .eq("id", d.id);
          }
        }
      };
      await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    }

    const [pending, sentTotal, failedTotal] = await Promise.all([
      countDeliveries(svc, campaignId, "pending"),
      countDeliveries(svc, campaignId, "sent"),
      countDeliveries(svc, campaignId, "failed"),
    ]);
    await svc
      .from("newsletter_campaigns")
      .update({
        sent_count: sentTotal,
        failed_count: failedTotal,
        ...(pending === 0 ? { status: "sent", sent_at: new Date().toISOString() } : {}),
      })
      .eq("id", campaignId);

    return json({
      success: true,
      done: pending === 0,
      sent_now: sentNow,
      failed_now: failedNow,
      pending,
      sent_total: sentTotal,
      failed_total: failedTotal,
      stopped: stopReason,
      daily_remaining: remainingToday((sentLast24h ?? 0) + sentNow, DAILY_LIMIT),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("send-newsletter:", message);
    return json({ error: message }, 500);
  }
});
