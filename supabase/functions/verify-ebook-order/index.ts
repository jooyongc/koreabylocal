// Verifies a captured PayPal order server-to-server before granting an e-book
// download — the browser must NOT be trusted to just say "I paid".
//
// REQUIRED secrets: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, and optionally
// PAYPAL_ENV=live|sandbox (default live).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PP_BASE =
  (Deno.env.get("PAYPAL_ENV") ?? "live") === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

async function paypalToken(): Promise<string> {
  const id = Deno.env.get("PAYPAL_CLIENT_ID")!;
  const secret = Deno.env.get("PAYPAL_CLIENT_SECRET")!;
  const res = await fetch(`${PP_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${id}:${secret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error("paypal_auth_failed");
  return (await res.json()).access_token;
}

function generateDownloadToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

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
    const { ebook_id, paypal_order_id, email, name } = await req.json();
    if (!ebook_id || !paypal_order_id || typeof email !== "string" || !email.includes("@")) {
      return json({ error: "ebook_id, paypal_order_id and email are required" }, 400);
    }

    if (!Deno.env.get("PAYPAL_CLIENT_ID") || !Deno.env.get("PAYPAL_CLIENT_SECRET")) {
      console.error("verify-ebook-order: PayPal is not configured");
      return json({ error: "Payments are not configured yet" }, 503);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { db: { schema: "koreabylocal" } },
    );

    // Idempotent: a retried/duplicate call for an order we already recorded
    // just hands back the same download token instead of erroring.
    const { data: existing } = await supabase
      .from("ebook_purchases")
      .select("download_token")
      .eq("payment_key", paypal_order_id)
      .maybeSingle();
    if (existing) return json({ download_token: existing.download_token });

    const { data: ebook, error: ebookError } = await supabase
      .from("ebooks")
      .select("id, price_usd")
      .eq("id", ebook_id)
      .eq("is_active", true)
      .maybeSingle();
    if (ebookError || !ebook) return json({ error: "E-book not found" }, 404);

    const token = await paypalToken();
    const ppRes = await fetch(`${PP_BASE}/v2/checkout/orders/${paypal_order_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const pp = await ppRes.json();
    const unit = pp?.purchase_units?.[0]?.amount;
    const paidEnough =
      pp?.status === "COMPLETED" &&
      unit &&
      Number(unit.value) >= Number(ebook.price_usd) &&
      unit.currency_code === "USD";

    if (!paidEnough) {
      console.error("verify-ebook-order: order not verified", paypal_order_id, pp?.status);
      return json({ error: "Payment could not be verified" }, 402);
    }

    const download_token = generateDownloadToken();
    const { error: insertError } = await supabase.from("ebook_purchases").insert({
      ebook_id: ebook.id,
      buyer_email: email,
      buyer_name: typeof name === "string" && name ? name : null,
      payment_provider: "paypal",
      payment_key: paypal_order_id,
      amount: Number(unit.value),
      currency: unit.currency_code,
      status: "completed",
      download_token,
      paid_at: new Date().toISOString(),
    });

    if (insertError) {
      // A unique-violation just means a racing duplicate call beat us to it.
      if (insertError.code === "23505") {
        const { data: raced } = await supabase
          .from("ebook_purchases")
          .select("download_token")
          .eq("payment_key", paypal_order_id)
          .maybeSingle();
        if (raced) return json({ download_token: raced.download_token });
      }
      console.error("verify-ebook-order: failed to record purchase:", insertError.message);
      return json({ error: "Failed to record purchase" }, 500);
    }

    return json({ download_token });
  } catch (err) {
    console.error("verify-ebook-order failed:", err instanceof Error ? err.message : err);
    return json({ error: "Internal server error" }, 500);
  }
});
