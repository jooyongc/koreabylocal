// Takes the money for an e-book and delivers it: records the purchase, hands
// the success page its download token, and emails the buyer the link. This is
// the ONLY place an e-book purchase is recorded.
//
// The browser calls this from the PayPal return page with nothing but the
// PayPal order id. It is not trusted: which book was bought comes from the
// order's reference_id as PayPal reports it, the amount is checked against the
// book's price, and the buyer's email is the one PayPal has for them.
//
// REQUIRED secrets: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET.
// Optional: PAYPAL_ENV=live|sandbox (default live).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { captureOrder, isPayPalConfigured } from "../_shared/paypal.ts";
import { buildDeliveryEmail, coversPrice, generateDownloadToken, parseEbookReference } from "../_shared/ebook-order.ts";
import { sendMail } from "../_shared/gmail.ts";

const SITE_URL = Deno.env.get("SITE_URL") || "https://koreabylocal.com";

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
    console.error("capture-ebook-payment: PayPal is not configured");
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
    console.error("capture-ebook-payment: capture threw:", err instanceof Error ? err.message : err);
    return json({ error: "capture_failed" }, 502);
  }

  if (!capture.ok) {
    console.error("capture-ebook-payment: not completed:", orderId, capture.status);
    return json({ error: "payment_not_completed", status: capture.status }, 402);
  }

  const ebookId = parseEbookReference(capture.referenceId);
  if (!ebookId) {
    console.error("capture-ebook-payment: order is not an e-book order:", orderId);
    return json({ error: "unknown_order" }, 422);
  }

  // Not filtered on is_active: a book taken down between checkout and return
  // has still been paid for.
  const { data: ebook } = await supabase
    .from("ebooks")
    .select("id, title, price_usd")
    .eq("id", ebookId)
    .maybeSingle();
  if (!ebook) {
    console.error("capture-ebook-payment: paid for a missing e-book:", orderId, ebookId);
    return json({ error: "unknown_order" }, 422);
  }

  if (!coversPrice(capture, ebook.price_usd)) {
    console.error(
      `capture-ebook-payment: amount mismatch on ${orderId}: got ${capture.amount} ${capture.currency}, expected ${ebook.price_usd} USD`,
    );
    return json({ error: "amount_mismatch" }, 402);
  }

  // One row per PayPal capture (payment_key is unique). A buyer refreshing the
  // return page lands on the existing row: same token, no second email.
  const paymentKey = capture.captureId ?? orderId;
  const { data: purchase, error: insertError } = await supabase
    .from("ebook_purchases")
    .insert({
      ebook_id: ebook.id,
      buyer_email: capture.payerEmail ?? "unknown@koreabylocal.com",
      buyer_name: capture.payerName,
      payment_provider: "paypal",
      payment_key: paymentKey,
      amount: capture.amount != null ? Number(capture.amount) : null,
      currency: "USD",
      status: "completed",
      download_token: generateDownloadToken(),
      paid_at: new Date().toISOString(),
    })
    .select("download_token, max_downloads")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: existing } = await supabase
        .from("ebook_purchases")
        .select("status, download_token")
        .eq("payment_key", paymentKey)
        .maybeSingle();
      if (existing) {
        return json({
          success: true,
          already_processed: true,
          download_token: existing.status === "completed" ? existing.download_token : undefined,
        });
      }
    }
    // The money is taken but there is no record: this needs a person.
    console.error("capture-ebook-payment: PAID BUT NOT RECORDED:", orderId, paymentKey, insertError.message);
    return json({ error: "record_failed" }, 500);
  }

  // Best-effort: the success page already shows the download button.
  if (capture.payerEmail) {
    const { subject, html } = buildDeliveryEmail({
      title: ebook.title,
      buyerName: capture.payerName,
      downloadUrl: `${SITE_URL}/ebook/download/${purchase.download_token}`,
      maxDownloads: purchase.max_downloads,
      siteUrl: SITE_URL,
    });
    const sent = await sendMail({ to: capture.payerEmail, subject, html });
    if (!sent.ok) console.error("capture-ebook-payment: delivery email failed:", sent.error);
  }

  return json({ success: true, download_token: purchase.download_token });
});
