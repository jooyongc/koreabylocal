import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@17.4.0?target=deno";

const SITE_URL = Deno.env.get("SITE_URL") || "https://koreabylocal.com";
const QUESTION_PRICE_CENTS = 100; // $1 per question

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

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

// The inquiry is inserted here (service role) rather than by the browser so we
// get its id back — the public RLS policy on inquiries is insert-only, so an
// anon `insert().select()` would be rejected.
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    if (!Deno.env.get("STRIPE_SECRET_KEY")) {
      console.error("create-inquiry-checkout: STRIPE_SECRET_KEY is not configured");
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

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: QUESTION_PRICE_CENTS,
            product_data: {
              name: "Ask a Local — one question",
              description: "A verified local in Korea answers your question, usually within a few hours.",
            },
          },
        },
      ],
      customer_email: email.trim(),
      metadata: {
        type: "inquiry",
        inquiry_id: String(inquiry.id),
      },
      success_url: `${SITE_URL}/ask-a-local/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/ask-a-local`,
    });

    // Correlate the row with its session so the webhook and admin can find it.
    await supabase.from("inquiries").update({ payment_key: session.id }).eq("id", inquiry.id);

    return json({ url: session.url });
  } catch (err) {
    console.error("create-inquiry-checkout failed:", err instanceof Error ? err.message : err);
    return json({ error: "Internal server error" }, 500);
  }
});
