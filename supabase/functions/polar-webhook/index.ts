// Polar calls this directly (no browser involved, so no CORS headers) when
// an order is paid. Verifies the Standard Webhooks signature, then branches
// on metadata.type to finish whichever of our two $-flows the checkout was
// for. This is the ONLY place either purchase is actually marked paid.
//
// REQUIRED secrets: POLAR_WEBHOOK_SECRET.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateEvent, WebhookVerificationError } from "https://esm.sh/@polar-sh/sdk@0.49.0/webhooks?target=deno";

function generateDownloadToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const secret = Deno.env.get("POLAR_WEBHOOK_SECRET");
  if (!secret) {
    console.error("polar-webhook: missing POLAR_WEBHOOK_SECRET");
    return new Response("Webhook not configured", { status: 500 });
  }

  const body = await req.text();
  const headers = Object.fromEntries(req.headers);

  let event: { type: string; data: Record<string, unknown> };
  try {
    event = validateEvent(body, headers, secret);
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      console.error("polar-webhook: signature verification failed:", err.message);
      return new Response("Invalid signature", { status: 403 });
    }
    console.error("polar-webhook: unexpected error verifying event:", err instanceof Error ? err.message : err);
    return new Response("Internal server error", { status: 500 });
  }

  if (event.type !== "order.paid") {
    // Not something we track — acknowledge so Polar stops retrying it.
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  const order = event.data as {
    checkoutId: string;
    totalAmount: number;
    customer?: { email?: string; name?: string };
    metadata?: Record<string, string>;
  };
  const metadata = order.metadata ?? {};

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { db: { schema: "koreabylocal" } },
  );

  if (metadata.type === "ebook") {
    const ebookId = Number(metadata.ebook_id);
    if (!ebookId) {
      console.error("polar-webhook: ebook order has no ebook_id metadata", order.checkoutId);
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    // Idempotent: Polar may redeliver this event.
    const { data: existing } = await supabase
      .from("ebook_purchases")
      .select("id")
      .eq("payment_key", order.checkoutId)
      .maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ received: true, already_processed: true }), { status: 200 });
    }

    const { error: insertError } = await supabase.from("ebook_purchases").insert({
      ebook_id: ebookId,
      buyer_email: order.customer?.email ?? "unknown@koreabylocal.com",
      buyer_name: order.customer?.name ?? null,
      payment_provider: "polar",
      payment_key: order.checkoutId,
      amount: order.totalAmount != null ? order.totalAmount / 100 : null,
      currency: "USD",
      status: "completed",
      download_token: generateDownloadToken(),
      paid_at: new Date().toISOString(),
    });

    if (insertError && insertError.code !== "23505") {
      console.error("polar-webhook: failed to record ebook purchase:", insertError.message);
      return new Response("Failed to record purchase", { status: 500 });
    }
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  if (metadata.type === "inquiry") {
    const inquiryId = Number(metadata.inquiry_id);
    if (!inquiryId) {
      console.error("polar-webhook: inquiry order has no inquiry_id metadata", order.checkoutId);
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    // Idempotent: only the first delivery flips the row to paid (and notifies).
    const { data: paid, error: updateError } = await supabase
      .from("inquiries")
      .update({ payment_status: "paid", payment_key: order.checkoutId, paid_at: new Date().toISOString() })
      .eq("id", inquiryId)
      .neq("payment_status", "paid")
      .select("name, email, subject, category, message")
      .maybeSingle();

    if (updateError) {
      console.error("polar-webhook: failed to mark inquiry paid:", updateError.message);
      return new Response("Failed to record payment", { status: 500 });
    }

    if (paid) {
      // The admin is only told about questions that were actually paid for.
      await supabase.functions.invoke("send-inquiry-notification", { body: paid }).catch((err) => {
        console.error("polar-webhook: inquiry notification failed:", err instanceof Error ? err.message : err);
      });
    }
    return new Response(JSON.stringify({ received: true, already_processed: !paid }), { status: 200 });
  }

  console.error("polar-webhook: order.paid with unknown metadata.type", order.checkoutId, metadata.type);
  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
