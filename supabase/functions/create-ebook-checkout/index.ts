import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@17.4.0?target=deno";

const SITE_URL = Deno.env.get("SITE_URL") || "https://koreabylocal.com";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    if (!Deno.env.get("STRIPE_SECRET_KEY")) {
      console.error("create-ebook-checkout: STRIPE_SECRET_KEY is not configured");
      return new Response(JSON.stringify({ error: "Payments are not configured yet" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { ebook_id, email } = await req.json();
    if (!ebook_id) {
      return new Response(JSON.stringify({ error: "ebook_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service role client — the public `ebooks_read` policy only allows
    // reading active ebooks, but we still bypass it here so a deactivated
    // e-book can't quietly go on selling itself.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { db: { schema: "koreabylocal" } },
    );

    const { data: ebook, error: ebookError } = await supabase
      .from("ebooks")
      .select("id, slug, title, cover_image_url, price_usd")
      .eq("id", ebook_id)
      .eq("is_active", true)
      .maybeSingle();

    if (ebookError || !ebook) {
      return new Response(JSON.stringify({ error: "E-book not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(Number(ebook.price_usd) * 100),
            product_data: {
              name: ebook.title,
              images: ebook.cover_image_url ? [ebook.cover_image_url] : undefined,
            },
          },
        },
      ],
      customer_email: typeof email === "string" && email ? email : undefined,
      metadata: {
        ebook_id: String(ebook.id),
        ebook_slug: ebook.slug,
      },
      success_url: `${SITE_URL}/ebook/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/ebook`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-ebook-checkout failed:", err instanceof Error ? err.message : err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
