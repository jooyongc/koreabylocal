import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GMAIL_SENDER, isMailConfigured, sendMail } from "../_shared/gmail.ts";

const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || GMAIL_SENDER;

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
    const { name, email, subject, category, message } = await req.json();

    const emailHtml = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#00005a">New Inquiry from Ask a Local</h2>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:6px 0;color:#6b7280;width:100px">Name</td><td style="padding:6px 0;font-weight:bold">${name}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Email</td><td style="padding:6px 0"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Category</td><td style="padding:6px 0">${category}</td></tr>
          ${subject ? `<tr><td style="padding:6px 0;color:#6b7280">Subject</td><td style="padding:6px 0">${subject}</td></tr>` : ""}
        </table>
        <h3 style="color:#00005a;margin-top:24px">Message</h3>
        <div style="background:#f8f9fa;padding:16px;border-radius:8px;white-space:pre-wrap;font-size:14px">${message}</div>
        <p style="margin-top:24px;color:#6b7280;font-size:12px">Korea by Local - Inquiry Notification</p>
      </div>
    `;

    if (!isMailConfigured()) {
      console.log("Gmail not configured. Would send:", { to: ADMIN_EMAIL, subject: `[KBL] Inquiry: ${subject || category}` });
      return new Response(
        JSON.stringify({ success: false, reason: "no_api_key", email_logged: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Reply-To the asker so the team can answer straight from the inbox.
    const sent = await sendMail({
      to: ADMIN_EMAIL,
      replyTo: typeof email === "string" && email.includes("@") ? email : undefined,
      subject: `[KBL] New Inquiry: ${subject || category} - ${name}`,
      html: emailHtml,
    });

    return new Response(
      JSON.stringify({ success: sent.ok }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (_err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
