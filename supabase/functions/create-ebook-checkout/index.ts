// Creates a Polar hosted Checkout Session for an e-book purchase. Polar
// redirects the buyer back to SITE_URL/ebook/success?checkout_id={CHECKOUT_ID}
// once paid; polar-webhook records the purchase from there (source of truth —
// this function itself never marks anything as paid).
//
// REQUIRED secrets: POLAR_ACCESS_TOKEN, POLAR_EBOOK_PRODUCT_ID, and
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
    const productId = Deno.env.get("POLAR_EBOOK_PRODUCT_ID");
    if (!accessToken || !productId) {
      console.error("create-ebook-checkout: Polar is not configured");
      return json({ error: "Payments are not configured yet" }, 503);
    }

    const { ebook_id, email } = await req.json();
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

    const isSandbox = (Deno.env.get("POLAR_ENV") ?? "production") === "sandbox";
    const polar = new Polar({ accessToken, ...(isSandbox ? { server: "sandbox" } : {}) });

    const checkout = await polar.checkouts.create({
      products: [productId],
      amount: Math.round(Number(ebook.price_usd) * 100),
      successUrl: `${SITE_URL}/ebook/success?checkout_id={CHECKOUT_ID}`,
      customerEmail: typeof email === "string" && email ? email : undefined,
      metadata: { type: "ebook", ebook_id: String(ebook.id) },
    });

    if (!checkout?.url) throw new Error("Polar did not return a checkout URL");

    return json({ url: checkout.url });
  } catch (err) {
    console.error("create-ebook-checkout failed:", err instanceof Error ? err.message : err);
    return json({ error: "Could not start checkout. Please try again." }, 500);
  }
});
