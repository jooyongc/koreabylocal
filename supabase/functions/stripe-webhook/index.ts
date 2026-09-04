import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@17.4.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

function generateDownloadToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Stripe posts here directly — no browser involved, so no CORS headers needed.
Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  if (!signature || !WEBHOOK_SECRET) {
    console.error("stripe-webhook: missing signature header or STRIPE_WEBHOOK_SECRET");
    return new Response("Webhook not configured", { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, WEBHOOK_SECRET);
  } catch (err) {
    console.error("stripe-webhook: signature verification failed:", err instanceof Error ? err.message : err);
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    // Not something we track — acknowledge so Stripe stops retrying it.
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const ebookId = Number(session.metadata?.ebook_id);

  if (!ebookId) {
    console.error("stripe-webhook: checkout session has no ebook_id metadata", session.id);
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { db: { schema: "koreabylocal" } },
  );

  // Idempotent: Stripe may redeliver this event. If we've already recorded a
  // purchase for this session, don't touch it again (a fresh token would
  // invalidate the one already shown/emailed to the buyer).
  const { data: existing } = await supabase
    .from("ebook_purchases")
    .select("id")
    .eq("payment_key", session.id)
    .maybeSingle();

  if (existing) {
    return new Response(JSON.stringify({ received: true, already_processed: true }), { status: 200 });
  }

  const { error: insertError } = await supabase.from("ebook_purchases").insert({
    ebook_id: ebookId,
    buyer_email: session.customer_details?.email ?? session.customer_email ?? "unknown@koreabylocal.com",
    buyer_name: session.customer_details?.name ?? null,
    payment_provider: "stripe",
    payment_key: session.id,
    amount: session.amount_total != null ? session.amount_total / 100 : null,
    currency: (session.currency ?? "usd").toUpperCase(),
    status: "completed",
    download_token: generateDownloadToken(),
    paid_at: new Date().toISOString(),
  });

  if (insertError) {
    // A unique-violation here just means a racing delivery beat us to it — fine.
    if (insertError.code !== "23505") {
      console.error("stripe-webhook: failed to record purchase:", insertError.message);
      return new Response("Failed to record purchase", { status: 500 });
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
