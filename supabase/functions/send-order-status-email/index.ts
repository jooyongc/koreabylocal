import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "orders@koreabylocal.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { orderId, status, cancelReason } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch order with items
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*, order_items(product_title, quantity, unit_price)")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get customer email
    let customerName = order.guest_name || "Customer";
    let customerEmail = order.guest_email;
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

    if (!customerEmail) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "no_customer_email" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build items table
    const itemsHtml = (order.order_items || [])
      .map(
        (item: { product_title: string; quantity: number; unit_price: number }) =>
          `<tr>
            <td style="padding:8px;border-bottom:1px solid #eee">${item.product_title}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${item.unit_price}</td>
          </tr>`
      )
      .join("");

    let subject: string;
    let bodyHtml: string;

    if (status === "confirmed") {
      subject = `[Korea By Local] Order ${order.order_number} Confirmed`;
      bodyHtml = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#00005a">Your Order Has Been Confirmed!</h2>
          <p>Hi ${customerName},</p>
          <p>Thank you for your order. We're happy to let you know that your order <strong>${order.order_number}</strong> has been confirmed and is being processed.</p>
          <h3 style="color:#00005a;margin-top:24px">Order Summary</h3>
          <table style="width:100%;border-collapse:collapse">
            <thead><tr style="background:#f8f9fa">
              <th style="padding:8px;text-align:left">Product</th>
              <th style="padding:8px;text-align:center">Qty</th>
              <th style="padding:8px;text-align:right">Price</th>
            </tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <p style="margin-top:16px;font-size:16px"><strong>Total: $${order.total_amount}</strong></p>
          <p style="margin-top:24px;color:#6b7280;font-size:12px">Korea by Local - Thank you for shopping with us!</p>
        </div>
      `;
    } else if (status === "cancelled") {
      subject = `[Korea By Local] Order ${order.order_number} Cancelled`;
      bodyHtml = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#dc2626">Order Cancelled</h2>
          <p>Hi ${customerName},</p>
          <p>We're sorry to inform you that your order <strong>${order.order_number}</strong> has been cancelled.</p>
          ${cancelReason ? `<p><strong>Reason:</strong> ${cancelReason}</p>` : ""}
          <h3 style="color:#00005a;margin-top:24px">Order Summary</h3>
          <table style="width:100%;border-collapse:collapse">
            <thead><tr style="background:#f8f9fa">
              <th style="padding:8px;text-align:left">Product</th>
              <th style="padding:8px;text-align:center">Qty</th>
              <th style="padding:8px;text-align:right">Price</th>
            </tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <p style="margin-top:16px;font-size:16px"><strong>Total: $${order.total_amount}</strong></p>
          <p style="margin-top:16px">If you have any questions, please don't hesitate to contact us.</p>
          <p style="margin-top:24px;color:#6b7280;font-size:12px">Korea by Local</p>
        </div>
      `;
    } else {
      return new Response(
        JSON.stringify({ skipped: true, reason: "no_email_for_status" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send via Resend
    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not set. Would send:", { to: customerEmail, subject });
      return new Response(
        JSON.stringify({ success: false, reason: "no_api_key", email_logged: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [customerEmail],
        subject,
        html: bodyHtml,
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
