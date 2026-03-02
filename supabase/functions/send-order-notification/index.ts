import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "info@koreabylocal.com";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "orders@koreabylocal.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderPayload {
  type: "INSERT" | "UPDATE";
  table: string;
  record: {
    id: number;
    order_number: string;
    status: string;
    total_amount: number;
    currency: string;
    user_id: string | null;
    guest_email: string | null;
    guest_name: string | null;
    customer_note: string | null;
    created_at: string;
  };
  old_record: {
    status: string;
  } | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const payload: OrderPayload = await req.json();
    const order = payload.record;

    // Only send notification when status changes to 'confirmed'
    if (order.status !== "confirmed") {
      return new Response(JSON.stringify({ skipped: true, reason: "not_confirmed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get order items
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: items } = await supabase
      .from("order_items")
      .select("product_title, quantity, unit_price")
      .eq("order_id", order.id);

    // Get customer info
    let customerName = order.guest_name || "Guest";
    let customerEmail = order.guest_email || "";
    if (order.user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", order.user_id)
        .single();
      if (profile) {
        customerName = profile.name || customerName;
        customerEmail = profile.email || customerEmail;
      }
    }

    // Build items HTML
    const itemsHtml = (items || [])
      .map(
        (item) =>
          `<tr>
            <td style="padding:8px;border-bottom:1px solid #eee">${item.product_title}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${item.unit_price}</td>
          </tr>`
      )
      .join("");

    const emailHtml = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#00005a">New Order Confirmed</h2>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:4px 0;color:#6b7280">Order Number</td><td style="padding:4px 0;font-weight:bold">${order.order_number}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280">Customer</td><td style="padding:4px 0">${customerName} (${customerEmail})</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280">Total</td><td style="padding:4px 0;font-weight:bold;color:#00005a">${order.currency} $${order.total_amount}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280">Date</td><td style="padding:4px 0">${new Date(order.created_at).toLocaleString("en-US", { timeZone: "Asia/Seoul" })}</td></tr>
          ${order.customer_note ? `<tr><td style="padding:4px 0;color:#6b7280">Note</td><td style="padding:4px 0">${order.customer_note}</td></tr>` : ""}
        </table>
        <h3 style="color:#00005a;margin-top:24px">Order Items</h3>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:#f8f9fa">
            <th style="padding:8px;text-align:left">Product</th>
            <th style="padding:8px;text-align:center">Qty</th>
            <th style="padding:8px;text-align:right">Price</th>
          </tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <p style="margin-top:24px;color:#6b7280;font-size:12px">Korea by Local - Order Notification System</p>
      </div>
    `;

    // Send via Resend API
    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not set. Email content:", emailHtml);
      return new Response(
        JSON.stringify({ success: false, reason: "no_api_key", email_logged: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [ADMIN_EMAIL],
        subject: `[KBL] New Order ${order.order_number} - $${order.total_amount}`,
        html: emailHtml,
      }),
    });

    const resendResult = await resendResponse.json();

    return new Response(
      JSON.stringify({ success: resendResponse.ok, resend: resendResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
