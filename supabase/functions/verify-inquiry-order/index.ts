// Verifies a captured PayPal order server-to-server, then records the Ask a
// Local question as paid and notifies the team — the browser must NOT be
// trusted to just say "I paid".
//
// REQUIRED secrets: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, and optionally
// PAYPAL_ENV=live|sandbox (default live).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const QUESTION_PRICE_USD = 1;

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
    const { name, email, subject, category, message, attachment_url, paypal_order_id } = await req.json();

    if (typeof name !== "string" || !name.trim()) return json({ error: "name is required" }, 400);
    if (typeof email !== "string" || !email.includes("@")) return json({ error: "email is required" }, 400);
    if (typeof message !== "string" || !message.trim()) return json({ error: "message is required" }, 400);
    if (!paypal_order_id) return json({ error: "paypal_order_id is required" }, 400);

    if (!Deno.env.get("PAYPAL_CLIENT_ID") || !Deno.env.get("PAYPAL_CLIENT_SECRET")) {
      console.error("verify-inquiry-order: PayPal is not configured");
      return json({ error: "Payments are not configured yet" }, 503);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { db: { schema: "koreabylocal" } },
    );

    // Idempotent: a retried/duplicate call for an order we already recorded
    // just confirms success again instead of creating a second inquiry.
    const { data: existing } = await supabase
      .from("inquiries")
      .select("id")
      .eq("payment_key", paypal_order_id)
      .maybeSingle();
    if (existing) return json({ success: true });

    const token = await paypalToken();
    const ppRes = await fetch(`${PP_BASE}/v2/checkout/orders/${paypal_order_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const pp = await ppRes.json();
    const unit = pp?.purchase_units?.[0]?.amount;
    const paidEnough =
      pp?.status === "COMPLETED" && unit && Number(unit.value) >= QUESTION_PRICE_USD && unit.currency_code === "USD";

    if (!paidEnough) {
      console.error("verify-inquiry-order: order not verified", paypal_order_id, pp?.status);
      return json({ error: "Payment could not be verified" }, 402);
    }

    const inquiry = {
      name: name.trim(),
      email: email.trim(),
      subject: typeof subject === "string" && subject.trim() ? subject.trim() : null,
      category: typeof category === "string" && category ? category : "General",
      message: message.trim(),
      attachment_url: typeof attachment_url === "string" && attachment_url ? attachment_url : null,
    };

    const { error: insertError } = await supabase.from("inquiries").insert({
      ...inquiry,
      payment_status: "paid",
      payment_key: paypal_order_id,
      paid_at: new Date().toISOString(),
    });

    if (insertError) {
      // A unique-violation just means a racing duplicate call beat us to it.
      if (insertError.code === "23505") return json({ success: true });
      console.error("verify-inquiry-order: insert failed:", insertError.message);
      return json({ error: "Payment succeeded but saving your question failed. Please email us directly." }, 500);
    }

    // Only questions that were actually paid for reach the team.
    await supabase.functions.invoke("send-inquiry-notification", { body: inquiry }).catch((err) => {
      console.error("verify-inquiry-order: notification failed:", err instanceof Error ? err.message : err);
    });

    return json({ success: true });
  } catch (err) {
    console.error("verify-inquiry-order failed:", err instanceof Error ? err.message : err);
    return json({ error: "Internal server error" }, 500);
  }
});
