// Saves the Ask a Local question (unpaid) and creates a PayPal order for the
// fee. PayPal sends the buyer back to SITE_URL/ask-a-local/success?token=<id>,
// and capture-inquiry-payment is what actually takes the money, marks the
// question paid and notifies the team — this function never does either.
//
// REQUIRED secrets: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET.
// Optional: PAYPAL_ENV=live|sandbox (default live), INQUIRY_PRICE_USD
// (default 1.00).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createOrder, isPayPalConfigured } from "../_shared/paypal.ts";

const SITE_URL = Deno.env.get("SITE_URL") || "https://koreabylocal.com";
const PRICE_USD = Deno.env.get("INQUIRY_PRICE_USD") || "1.00";

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
      console.error("create-inquiry-checkout: PayPal is not configured");
      return json({ error: "Payments are not configured yet" }, 503);
    }

    const { name, email, subject, category, message, attachment_url } = await req.json();
    if (typeof name !== "string" || !name.trim()) return json({ error: "name is required" }, 400);
    if (typeof email !== "string" || !email.includes("@")) return json({ error: "email is required" }, 400);
    if (typeof message !== "string" || !message.trim()) return json({ error: "message is required" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { db: { schema: "koreabylocal" } },
    );

    // Inserted here (service role) so we get an id back — the public RLS
    // policy on inquiries is insert-only, so an anon insert().select() would
    // be rejected. The question is real but unpaid until the webhook flips it.
    const { data: inquiry, error: insertError } = await supabase
      .from("inquiries")
      .insert({
        name: name.trim(),
        email: email.trim(),
        subject: typeof subject === "string" && subject.trim() ? subject.trim() : null,
        category: typeof category === "string" && category ? category : "General",
        message: message.trim(),
        attachment_url: typeof attachment_url === "string" && attachment_url ? attachment_url : null,
        payment_status: "unpaid",
      })
      .select("id")
      .single();

    if (insertError || !inquiry) {
      console.error("create-inquiry-checkout: insert failed:", insertError?.message);
      return json({ error: "Could not save your question" }, 500);
    }

    // reference_id carries our inquiry id through PayPal and back, so the
    // capture step never has to trust anything the browser tells it.
    const order = await createOrder({
      amount: PRICE_USD,
      currency: "USD",
      description: `Ask a Local question ${inquiry.id}`,
      referenceId: String(inquiry.id),
      returnUrl: `${SITE_URL}/ask-a-local/success`,
      cancelUrl: `${SITE_URL}/ask-a-local?cancelled=1`,
    });

    return json({ url: order.approveUrl });
  } catch (err) {
    console.error("create-inquiry-checkout failed:", err instanceof Error ? err.message : err);
    return json({ error: "Could not start checkout. Please try again." }, 500);
  }
});
