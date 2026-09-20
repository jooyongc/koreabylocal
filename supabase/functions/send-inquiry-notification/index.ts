import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GMAIL_SENDER, isMailConfigured, sendMail } from "../_shared/gmail.ts";
import type { AiTriage } from "../_shared/triage-inquiry.ts";

const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || GMAIL_SENDER;
const SITE_URL = Deno.env.get("SITE_URL") || "https://koreabylocal.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Everything below is written by a stranger and lands in someone's mail client,
// so none of it goes into the template raw.
const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function triageBlock(triage: AiTriage | null, formCategory: string): string {
  if (!triage) return "";

  const rows: string[] = [];

  // Show both readings when they disagree — the visitor picked one from a drop
  // down, and either of them can be the more useful label.
  if (triage.category && triage.category.toLowerCase() !== String(formCategory).toLowerCase()) {
    rows.push(
      `<tr><td style="padding:6px 0;color:#6b7280;width:120px">Read as</td>` +
        `<td style="padding:6px 0"><b>${esc(triage.category)}</b>` +
        `<span style="color:#9ca3af"> (${Math.round((triage.category_confidence ?? 0) * 100)}% confident) — the form said ${esc(formCategory)}</span></td></tr>`,
    );
  }

  if (triage.related.length > 0) {
    const links = triage.related
      .map(
        (r) =>
          `<li style="margin:3px 0"><a href="${SITE_URL}/guidebook/${encodeURIComponent(r.slug)}" style="color:#00005a">${esc(r.title)}</a></li>`,
      )
      .join("");
    rows.push(
      `<tr><td style="padding:6px 0;color:#6b7280;vertical-align:top">Already answered?</td>` +
        `<td style="padding:6px 0"><ul style="margin:0;padding-left:18px;font-size:14px">${links}</ul></td></tr>`,
    );
  }

  if (rows.length === 0) return "";

  return `
        <div style="background:#f5f3ff;border-left:3px solid #00005a;padding:10px 14px;margin:16px 0">
          <div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#6b7280;margin-bottom:4px">Suggested by AI — check before relying on it</div>
          <table style="width:100%;border-collapse:collapse">${rows.join("")}</table>
        </div>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { name, email, subject, category, message, ai_triage } = await req.json();
    const triage = (ai_triage ?? null) as AiTriage | null;
    const urgent = triage?.urgent === true;

    const emailHtml = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#00005a">New Inquiry from Ask a Local</h2>
        ${urgent ? `<p style="background:#ffe4e6;color:#9f1239;font-weight:bold;padding:9px 12px;border-radius:6px;margin:0 0 12px">Looks time-sensitive — the traveler may be arriving within about 48 hours.</p>` : ""}
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:6px 0;color:#6b7280;width:100px">Name</td><td style="padding:6px 0;font-weight:bold">${esc(name)}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Email</td><td style="padding:6px 0"><a href="mailto:${encodeURIComponent(String(email ?? ""))}">${esc(email)}</a></td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Category</td><td style="padding:6px 0">${esc(category)}</td></tr>
          ${subject ? `<tr><td style="padding:6px 0;color:#6b7280">Subject</td><td style="padding:6px 0">${esc(subject)}</td></tr>` : ""}
        </table>
        ${triageBlock(triage, category)}
        <h3 style="color:#00005a;margin-top:24px">Message</h3>
        <div style="background:#f8f9fa;padding:16px;border-radius:8px;white-space:pre-wrap;font-size:14px">${esc(message)}</div>
        <p style="margin-top:24px;color:#6b7280;font-size:12px">Korea by Local - Inquiry Notification</p>
      </div>
    `;

    const subjectLine = `${urgent ? "[URGENT] " : ""}[KBL] New Inquiry: ${subject || category} - ${name}`;

    if (!isMailConfigured()) {
      console.log("Gmail not configured. Would send:", { to: ADMIN_EMAIL, subject: subjectLine });
      return new Response(
        JSON.stringify({ success: false, reason: "no_api_key", email_logged: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Reply-To the asker so the team can answer straight from the inbox.
    const sent = await sendMail({
      to: ADMIN_EMAIL,
      replyTo: typeof email === "string" && email.includes("@") ? email : undefined,
      subject: subjectLine,
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
