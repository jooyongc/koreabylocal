// Creates a PayPal order for an e-book. PayPal sends the buyer back to
// SITE_URL/ebook/success?token=<order id>, and capture-ebook-payment is what
// actually takes the money and records the purchase — this function never
// does either, and writes nothing.
//
// REQUIRED secrets: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET.
// Optional: PAYPAL_ENV=live|sandbox (default live).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createOrder, isPayPalConfigured } from "../_shared/paypal.ts";
import { ebookReference, priceString } from "../_shared/ebook-order.ts";

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
      console.error("create-ebook-checkout: PayPal is not configured");
      return json({ error: "Payments are not configured yet" }, 503);
    }

    const { ebook_id } = await req.json();
    if (!ebook_id) return json({ error: "ebook_id is required" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { db: { schema: "koreabylocal" } },
    );

    const { data: ebook, error: ebookError } = await supabase
      .from("ebooks")
      .select("id, title, price_usd")
      .eq("id", ebook_id)
      .eq("is_active", true)
      .maybeSingle();

    if (ebookError || !ebook) return json({ error: "E-book not found" }, 404);
    // PayPal rejects a $0 order; free books are handed out by claim-free-ebook.
    if (Number(ebook.price_usd) <= 0) return json({ error: "This e-book is free" }, 400);

    // The price is always the one in the database, never one from the browser.
    const order = await createOrder({
      amount: priceString(ebook.price_usd),
      currency: "USD",
      description: `${ebook.title} (e-book)`,
      referenceId: ebookReference(ebook.id),
      returnUrl: `${SITE_URL}/ebook/success`,
      cancelUrl: `${SITE_URL}/ebook?cancelled=1`,
    });

    return json({ url: order.approveUrl });
  } catch (err) {
    console.error("create-ebook-checkout failed:", err instanceof Error ? err.message : err);
    return json({ error: "Could not start checkout. Please try again." }, 500);
  }
});
