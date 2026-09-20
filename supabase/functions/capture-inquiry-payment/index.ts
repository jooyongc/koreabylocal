// Takes the money for an Ask a Local question and finishes the flow: marks the
// question paid, triages it, and tells the team. This is the ONLY place an
// inquiry is marked paid.
//
// The browser calls this from the PayPal return page with nothing but the
// PayPal order id. It is not trusted: which question was paid for comes from
// the order's reference_id as PayPal reports it, and the amount is checked
// against what we asked for.
//
// REQUIRED secrets: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET.
// Optional: PAYPAL_ENV=live|sandbox (default live), INQUIRY_PRICE_USD
// (default 1.00).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { captureOrder, isPayPalConfigured } from "../_shared/paypal.ts";
import { triageInquiry, type AiTriage } from "../_shared/triage-inquiry.ts";
import { isWhatsAppConfigured, notifyTeam } from "../_shared/whatsapp.ts";

const PRICE_USD = Deno.env.get("INQUIRY_PRICE_USD") || "1.00";
const SITE_URL = Deno.env.get("SITE_URL") || "https://koreabylocal.com";

/**
 * Pushes the question to the team's phones. Deliberately carries the whole
 * question rather than a "you have a new inquiry" nudge — the point is that
 * someone can read it on the bus and decide whether it needs answering now.
 *
 * The asker's email is included because the reply goes back by email; their
 * name is not needed to triage and is left out.
 */
async function notifyWhatsApp(
  inquiryId: number,
  inquiry: { email: string; category: string; message: string },
  triage: AiTriage | null,
): Promise<void> {
  if (!isWhatsAppConfigured()) return;

  const category = triage?.category ?? inquiry.category;
  const question = inquiry.message.length > 700 ? `${inquiry.message.slice(0, 700)}…` : inquiry.message;
  const related = triage?.related?.length
    ? `\n\nAlready answered?\n${triage.related.map((r) => `• ${r.title}\n  ${SITE_URL}/guidebook/${r.slug}`).join("\n")}`
    : "";
  const link = `${SITE_URL}/admin/inquiries/${inquiryId}`;

  const text =
    `${triage?.urgent ? "🔴 URGENT — traveler may arrive within ~48h\n\n" : ""}` +
    `Paid question #${inquiryId} · ${category}\n` +
    `Reply to: ${inquiry.email}\n\n` +
    `"${question}"${related}\n\n${link}`;

  try {
    const results = await notifyTeam(text, {
      templateParams: [String(inquiryId), category, question, link],
    });
    const failed = results.filter((r) => !r.ok);
    if (failed.length > 0) {
      console.error(`capture-inquiry-payment: whatsapp failed for ${failed.length}/${results.length} recipient(s)`);
    }
  } catch (err) {
    console.error("capture-inquiry-payment: whatsapp threw:", err instanceof Error ? err.message : err);
  }
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  if (!isPayPalConfigured()) {
    console.error("capture-inquiry-payment: PayPal is not configured");
    return json({ error: "payments_not_configured" }, 503);
  }

  let orderId: string;
  try {
    const body = await req.json();
    orderId = String(body?.orderId ?? "").trim();
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  if (!orderId) return json({ error: "missing_order_id" }, 400);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { db: { schema: "koreabylocal" } },
  );

  let capture;
  try {
    capture = await captureOrder(orderId);
  } catch (err) {
    console.error("capture-inquiry-payment: capture threw:", err instanceof Error ? err.message : err);
    return json({ error: "capture_failed" }, 502);
  }

  if (!capture.ok) {
    console.error("capture-inquiry-payment: not completed:", orderId, capture.status);
    return json({ error: "payment_not_completed", status: capture.status }, 402);
  }

  const inquiryId = Number(capture.referenceId);
  if (!inquiryId) {
    console.error("capture-inquiry-payment: order has no usable reference_id:", orderId);
    return json({ error: "unknown_order" }, 422);
  }

  // Underpayment would otherwise buy a $1 service for a cent. Currency is
  // checked too, since PayPal will happily complete an order in another one.
  if (capture.currency !== "USD" || Number(capture.amount) + 1e-9 < Number(PRICE_USD)) {
    console.error(
      `capture-inquiry-payment: amount mismatch on ${orderId}: got ${capture.amount} ${capture.currency}, expected ${PRICE_USD} USD`,
    );
    return json({ error: "amount_mismatch" }, 402);
  }

  // Idempotent: only the first capture flips the row, so a buyer refreshing the
  // return page cannot trigger a second triage or a second notification.
  const { data: paid, error: updateError } = await supabase
    .from("inquiries")
    .update({
      payment_status: "paid",
      payment_key: capture.captureId ?? orderId,
      paid_at: new Date().toISOString(),
    })
    .eq("id", inquiryId)
    .neq("payment_status", "paid")
    .select("name, email, subject, category, message")
    .maybeSingle();

  if (updateError) {
    console.error("capture-inquiry-payment: failed to mark inquiry paid:", updateError.message);
    return json({ error: "record_failed" }, 500);
  }
  if (!paid) {
    // Already processed — the money is taken and the team already knows.
    return json({ success: true, already_processed: true });
  }

  // Judge the question before the notification goes out, so the email can lead
  // with "urgent" and carry the guides that already answer it. Only the message
  // body is sent for judging — never the name or email.
  //
  // Wrapped whole: the payment is already taken, and no failure here is worth
  // failing the request back to a buyer who has paid.
  let aiTriage: AiTriage | null = null;
  try {
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, title, excerpt")
      .eq("status", "published");
    aiTriage = await triageInquiry(paid.message, posts ?? []);
    if (aiTriage) {
      await supabase.from("inquiries").update({ ai_triage: aiTriage }).eq("id", inquiryId);
    }
  } catch (err) {
    console.error("capture-inquiry-payment: triage failed:", err instanceof Error ? err.message : err);
  }

  // Email and WhatsApp go out together: whoever sees their phone first takes it.
  // Both are best-effort — the money is taken either way.
  await Promise.all([
    supabase.functions
      .invoke("send-inquiry-notification", { body: { ...paid, ai_triage: aiTriage } })
      .catch((err) => {
        console.error("capture-inquiry-payment: notification failed:", err instanceof Error ? err.message : err);
      }),
    notifyWhatsApp(inquiryId, paid, aiTriage),
  ]);

  return json({ success: true });
});
