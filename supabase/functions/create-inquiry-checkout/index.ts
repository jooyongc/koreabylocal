// Saves the Ask a Local question (unpaid) and creates a Polar hosted
// Checkout Session for the $1 fee. Polar redirects the buyer back to
// SITE_URL/ask-a-local/success?checkout_id={CHECKOUT_ID} once paid;
// polar-webhook is what actually marks the question paid and notifies the
// team — this function never does either itself.
//
// REQUIRED secrets: POLAR_ACCESS_TOKEN, POLAR_INQUIRY_PRODUCT_ID, and
// optionally POLAR_ENV=sandbox|production (default production).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Polar } from "https://esm.sh/@polar-sh/sdk@0.49.0?target=deno";

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
    const accessToken = Deno.env.get("POLAR_ACCESS_TOKEN");
    const productId = Deno.env.get("POLAR_INQUIRY_PRODUCT_ID");
    if (!accessToken || !productId) {
      console.error("create-inquiry-checkout: Polar is not configured");
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

    const isSandbox = (Deno.env.get("POLAR_ENV") ?? "production") === "sandbox";
    const polar = new Polar({ accessToken, ...(isSandbox ? { server: "sandbox" } : {}) });

    const checkout = await polar.checkouts.create({
      products: [productId],
      successUrl: `${SITE_URL}/ask-a-local/success?checkout_id={CHECKOUT_ID}`,
      customerEmail: email.trim(),
      customerName: name.trim(),
      metadata: { type: "inquiry", inquiry_id: String(inquiry.id) },
    });

    if (!checkout?.url) throw new Error("Polar did not return a checkout URL");

    return json({ url: checkout.url });
  } catch (err) {
    console.error("create-inquiry-checkout failed:", err instanceof Error ? err.message : err);
    return json({ error: "Could not start checkout. Please try again." }, 500);
  }
});
