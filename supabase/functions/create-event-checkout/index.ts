// Creates a PayPal order for an event ticket. PayPal sends the buyer back to
// SITE_URL/events/success?token=<order id>, and capture-event-payment is what
// actually takes the money and records the ticket — this function never does
// either, and writes nothing.
//
// REQUIRED secrets: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET.
// Optional: PAYPAL_ENV=live|sandbox (default live).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createOrder, isPayPalConfigured } from "../_shared/paypal.ts";
import { eventReference, priceString } from "../_shared/event-order.ts";

const SITE_URL = Deno.env.get("SITE_URL") || "https://koreabylocal.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    if (!isPayPalConfigured()) {
      console.error("create-event-checkout: PayPal is not configured");
      return json({ error: "Payments are not configured yet" }, 503);
    }

    const { event_id } = await req.json();
    if (!event_id) return json({ error: "event_id is required" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { db: { schema: "koreabylocal" } },
    );

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, slug, title, price_usd, capacity, sold_count")
      .eq("id", event_id)
      .eq("is_active", true)
      .maybeSingle();

    if (eventError || !event) return json({ error: "Event not found" }, 404);
    if (event.sold_count >= event.capacity) return json({ error: "This event is sold out" }, 409);

    // The price is always the one in the database, never one from the browser.
    const order = await createOrder({
      amount: priceString(event.price_usd),
      currency: "USD",
      description: `${event.title} (ticket)`,
      referenceId: eventReference(event.id),
      returnUrl: `${SITE_URL}/events/success`,
      cancelUrl: `${SITE_URL}/events/${event.slug}?cancelled=1`,
    });

    return json({ url: order.approveUrl });
  } catch (err) {
    console.error("create-event-checkout failed:", err instanceof Error ? err.message : err);
    return json({ error: "Could not start checkout. Please try again." }, 500);
  }
});
