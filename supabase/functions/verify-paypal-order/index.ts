// Server-side PayPal verification — the SECURE replacement for the client-side
// "mark order paid" step. The browser must NOT be trusted to set payment_status.
//
// Flow: client passes { orderId (our DB id), paypalOrderId }. This function
// asks PayPal (server-to-server, with the secret) whether that PayPal order is
// actually COMPLETED for the right amount, then updates the order with the
// service-role key (bypassing RLS).
//
// REQUIRED secrets (supabase secrets set ...): PAYPAL_CLIENT_ID,
// PAYPAL_CLIENT_SECRET, and optionally PAYPAL_ENV=live|sandbox (default live).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  try {
    const { orderId, paypalOrderId } = await req.json();
    if (!orderId || !paypalOrderId) {
      return new Response(JSON.stringify({ error: "missing_params" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { db: { schema: "koreabylocal" } },
    );

    // Our record of what should be paid.
    const { data: order, error: oErr } = await supabase
      .from("orders")
      .select("id, total_amount, currency, payment_status")
      .eq("id", orderId)
      .single();
    if (oErr || !order) throw new Error("order_not_found");
    if (order.payment_status === "paid") {
      return new Response(JSON.stringify({ success: true, alreadyPaid: true }), {
        status: 200, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Verify with PayPal.
    const token = await paypalToken();
    const ppRes = await fetch(`${PP_BASE}/v2/checkout/orders/${paypalOrderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const pp = await ppRes.json();
    const unit = pp?.purchase_units?.[0]?.amount;
    const captured =
      pp?.status === "COMPLETED" &&
      unit &&
      Number(unit.value) >= Number(order.total_amount) &&
      unit.currency_code === order.currency;

    if (!captured) {
      return new Response(JSON.stringify({ success: false, status: pp?.status ?? "unknown" }), {
        status: 402, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    await supabase
      .from("orders")
      .update({ payment_status: "paid", status: "confirmed", payment_method: "paypal" })
      .eq("id", orderId);

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
