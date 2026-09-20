// Delivers a local's answer to the traveler who paid for it.
//
// Until this existed, the admin screen wrote the reply to the database and
// marked the question "replied" while sending nothing — a paying customer could
// be recorded as answered and never hear back. The screen now refuses to mark
// anything replied unless this function reports a send.
//
// Admin-only: the caller's JWT must belong to a profile with role 'admin'.
// The reply text comes from the request rather than the row so the admin sees
// exactly what goes out, but the recipient is always read from the database —
// the browser never chooses who gets emailed.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isMailConfigured, sendMail } from "../_shared/gmail.ts";

const SITE_URL = Deno.env.get("SITE_URL") || "https://koreabylocal.com";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

// The answer and the traveler's own question both go into HTML, and both
// contain text we did not write.
const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const paragraphs = (text: string) =>
  esc(text)
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#374151">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");

function buildEmail(name: string, question: string, reply: string): { subject: string; html: string } {
  const firstName = name.trim().split(/\s+/)[0] || "there";
  return {
    subject: "Your answer from a local — Korea by Local",
    html: `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;background:#fff">
      <span style="display:none;max-height:0;overflow:hidden">A local has answered your question.</span>
      <div style="background:#12184a;padding:28px 32px;text-align:center;border-radius:14px 14px 0 0">
        <span style="font-size:22px;font-weight:800;color:#fff">Korea</span>
        <span style="font-size:18px;font-style:italic;color:#fff;padding:0 3px">by</span>
        <span style="font-size:22px;font-weight:800;color:#ff2e97">Local</span>
      </div>
      <div style="border:1px solid #eee;border-top:none;padding:32px;border-radius:0 0 14px 14px">
        <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:#374151">
          Hi ${esc(firstName)}, thanks for asking — here's your answer.
        </p>

        ${paragraphs(reply)}

        <div style="margin:24px 0;padding:14px 16px;background:#f8f9fa;border-left:3px solid #d1d5db;border-radius:6px">
          <div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#9ca3af;margin-bottom:6px">You asked</div>
          <div style="font-size:13.5px;line-height:1.6;color:#6b7280;white-space:pre-wrap">${esc(question)}</div>
        </div>

        <p style="margin:0 0 20px;font-size:14px;line-height:1.65;color:#6b7280">
          Something still unclear? Just reply to this email — it reaches us directly.
        </p>

        <a href="${SITE_URL}/guidebook" style="display:inline-block;background:#ff2e97;color:#fff;padding:13px 30px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14.5px">Browse the guidebook</a>

        <p style="margin-top:32px;padding-top:20px;border-top:1px solid #eee;color:#9ca3af;font-size:12px;line-height:1.6">
          You're receiving this because you asked a question at koreabylocal.com.
          Korea by Local — authentic Korean travel, from real locals.
        </p>
      </div>
    </div>`,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const svc = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { db: { schema: "koreabylocal" }, auth: { persistSession: false } },
  );

  const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  if (!jwt) return json({ error: "unauthorized" }, 401);
  const { data: u } = await svc.auth.getUser(jwt);
  if (!u?.user) return json({ error: "unauthorized" }, 401);
  const { data: prof } = await svc.from("profiles").select("role").eq("id", u.user.id).maybeSingle();
  if (prof?.role !== "admin") return json({ error: "forbidden" }, 403);

  let body: { id?: number; reply?: string } = {};
  try { body = await req.json(); } catch { /* validated below */ }
  const id = Number(body.id);
  const reply = (body.reply ?? "").trim();
  if (!id) return json({ error: "missing_id" }, 400);
  if (!reply) return json({ error: "empty_reply" }, 400);

  const { data: inquiry, error } = await svc
    .from("inquiries")
    .select("name, email, message, payment_status")
    .eq("id", id)
    .maybeSingle();

  if (error) return json({ error: "lookup_failed", detail: error.message }, 500);
  if (!inquiry) return json({ error: "not_found" }, 404);
  if (!inquiry.email?.includes("@")) return json({ error: "no_recipient" }, 422);

  if (!isMailConfigured()) {
    // Reported rather than swallowed: the admin screen keys "replied" off this,
    // and a question must not look answered because mail was switched off.
    console.error("send-inquiry-reply: Gmail is not configured");
    return json({ error: "mail_not_configured" }, 503);
  }

  const { subject, html } = buildEmail(inquiry.name ?? "", inquiry.message ?? "", reply);
  const sent = await sendMail({ to: inquiry.email, subject, html });

  if (!sent.ok) {
    console.error(`send-inquiry-reply: send failed for inquiry ${id}: ${sent.status} ${sent.error}`);
    return json({ error: "send_failed", detail: sent.error }, 502);
  }

  // Written here, after the send, so the record cannot claim a reply that never left.
  const { error: updateError } = await svc
    .from("inquiries")
    .update({ admin_reply: reply, status: "replied", replied_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) {
    // The traveler has their answer; only our bookkeeping failed.
    console.error(`send-inquiry-reply: sent but could not record inquiry ${id}: ${updateError.message}`);
    return json({ success: true, recorded: false, detail: updateError.message });
  }

  return json({ success: true, recorded: true, to: inquiry.email });
});
