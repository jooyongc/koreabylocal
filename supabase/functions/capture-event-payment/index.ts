// Takes the money for an event ticket and confirms it: records the ticket,
// hands the success page its confirmation code, and emails the buyer. This is
// the ONLY place a ticket purchase is recorded.
//
// The browser calls this from the PayPal return page with nothing but the
// PayPal order id. It is not trusted: which event was bought comes from the
// order's reference_id as PayPal reports it, the amount is checked against
// the event's price, and the buyer's email is the one PayPal has for them.
//
// REQUIRED secrets: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET.
// Optional: PAYPAL_ENV=live|sandbox (default live).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { captureOrder, isPayPalConfigured } from "../_shared/paypal.ts";
import { buildTicketEmail, coversPrice, generateConfirmationCode, parseEventReference } from "../_shared/event-order.ts";
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
    console.error("capture-event-payment: PayPal is not configured");
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
    console.error("capture-event-payment: capture threw:", err instanceof Error ? err.message : err);
    return json({ error: "capture_failed" }, 502);
  }

  if (!capture.ok) {
    console.error("capture-event-payment: not completed:", orderId, capture.status);
    return json({ error: "payment_not_completed", status: capture.status }, 402);
  }

  const eventId = parseEventReference(capture.referenceId);
  if (!eventId) {
    console.error("capture-event-payment: order is not an event order:", orderId);
    return json({ error: "unknown_order" }, 422);
  }

  const { data: event } = await supabase
    .from("events")
    .select("id, title, price_usd, event_date, time_label, location, capacity, sold_count")
    .eq("id", eventId)
    .maybeSingle();
  if (!event) {
    console.error("capture-event-payment: paid for a missing event:", orderId, eventId);
    return json({ error: "unknown_order" }, 422);
  }

  if (!coversPrice(capture, event.price_usd)) {
    console.error(
      `capture-event-payment: amount mismatch on ${orderId}: got ${capture.amount} ${capture.currency}, expected ${event.price_usd} USD`,
    );
    return json({ error: "amount_mismatch" }, 402);
  }

  // One row per PayPal capture (payment_key is unique). A buyer refreshing the
  // return page lands on the existing row: same code, no second email.
  const paymentKey = capture.captureId ?? orderId;
  const { data: ticket, error: insertError } = await supabase
    .from("event_tickets")
    .insert({
      event_id: event.id,
      buyer_email: capture.payerEmail ?? "unknown@koreabylocal.com",
      buyer_name: capture.payerName,
      payment_provider: "paypal",
      payment_key: paymentKey,
      amount: capture.amount != null ? Number(capture.amount) : null,
      currency: "USD",
      status: "completed",
      confirmation_code: generateConfirmationCode(),
      paid_at: new Date().toISOString(),
    })
    .select("confirmation_code")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: existing } = await supabase
        .from("event_tickets")
        .select("status, confirmation_code")
        .eq("payment_key", paymentKey)
        .maybeSingle();
      if (existing) {
        return json({
          success: true,
          already_processed: true,
          confirmation_code: existing.status === "completed" ? existing.confirmation_code : undefined,
        });
      }
    }
    // The money is taken but there is no record: this needs a person.
    console.error("capture-event-payment: PAID BUT NOT RECORDED:", orderId, paymentKey, insertError.message);
    return json({ error: "record_failed" }, 500);
  }

  // Capacity is enforced best-effort here (create-event-checkout already
  // refuses a sold-out event) — a payment that already went through is
  // always honoured rather than silently dropped. Logged so a true oversell
  // (two people buying the last spot at the same instant) gets noticed.
  const { data: updated } = await supabase
    .from("events")
    .update({ sold_count: event.sold_count + 1 })
    .eq("id", event.id)
    .lt("sold_count", event.capacity)
    .select("sold_count")
    .maybeSingle();
  if (!updated) {
    console.error("capture-event-payment: event oversold:", event.id, orderId);
  }

  // Best-effort: the success page already shows the confirmation code.
  if (capture.payerEmail) {
    const { subject, html } = buildTicketEmail({
      eventTitle: event.title,
      buyerName: capture.payerName,
      confirmationCode: ticket.confirmation_code,
      eventDate: event.event_date,
      timeLabel: event.time_label,
      location: event.location,
      siteUrl: SITE_URL,
    });
    const sent = await sendMail({ to: capture.payerEmail, subject, html });
    if (!sent.ok) console.error("capture-event-payment: confirmation email failed:", sent.error);
  }

  return json({ success: true, confirmation_code: ticket.confirmation_code });
});
