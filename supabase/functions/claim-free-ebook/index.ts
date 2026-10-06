// Delivers a $0 e-book straight to an email address, with no payment step at
// all — PayPal cannot process a $0.00 order, so a free book can't go through
// create-ebook-checkout/capture-ebook-payment like a paid one does.
//
// Writes the same kind of `ebook_purchases` row a paid capture would (so the
// existing download-ebook function and /ebook/download/:token page work
// unchanged for a free claim), just with payment_provider "free" and no
// PayPal order behind it. Refuses outright if the book isn't actually priced
// at $0 — this must never become a way to skip payment on a real book.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendMail } from "../_shared/gmail.ts";

const SITE_URL = Deno.env.get("SITE_URL") || "https://koreabylocal.com";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

function generateDownloadToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// The title and the claimer's name are text we did not write.
const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function buildFreeDeliveryEmail(input: { title: string; buyerName: string | null; downloadUrl: string; maxDownloads: number; siteUrl: string }) {
  const firstName = (input.buyerName ?? "").trim().split(/\s+/)[0] || "there";
  return {
    subject: `Your free e-book: ${input.title}`,
    html: `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;background:#fff">
      <span style="display:none;max-height:0;overflow:hidden">Your download link is inside.</span>
      <div style="background:#12184a;padding:28px 32px;text-align:center;border-radius:14px 14px 0 0">
        <span style="font-size:22px;font-weight:800;color:#fff">Korea</span>
        <span style="font-size:18px;font-style:italic;color:#fff;padding:0 3px">by</span>
        <span style="font-size:22px;font-weight:800;color:#ff2e97">Local</span>
      </div>
      <div style="border:1px solid #eee;border-top:none;padding:32px;border-radius:0 0 14px 14px">
        <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#374151">
          Hi ${esc(firstName)}, here's your free copy of <strong>${esc(input.title)}</strong>.
        </p>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.65;color:#374151">
          Your copy is ready. The button below downloads the PDF.
        </p>

        <a href="${esc(input.downloadUrl)}" style="display:inline-block;background:#ff2e97;color:#fff;padding:13px 30px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14.5px">Download your e-book</a>

        <p style="margin:24px 0 0;font-size:13.5px;line-height:1.65;color:#6b7280">
          This link works ${input.maxDownloads} times, so save the PDF somewhere you'll find it.
        </p>

        <p style="margin-top:32px;padding-top:20px;border-top:1px solid #eee;color:#9ca3af;font-size:12px;line-height:1.6">
          You're receiving this because you requested a free e-book at
          <a href="${esc(input.siteUrl)}" style="color:#9ca3af">koreabylocal.com</a>.
          Korea by Local — authentic Korean travel, from real locals.
        </p>
      </div>
    </div>`,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let ebookId: number;
  let email: string;
  let name: string | null;
  try {
    const body = await req.json();
    ebookId = Number(body?.ebook_id);
    email = String(body?.email ?? "").trim();
    name = body?.name ? String(body.name).trim() : null;
  } catch {
    return json({ error: "bad_request" }, 400);
  }

  if (!ebookId) return json({ error: "ebook_id is required" }, 400);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "A valid email is required" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { db: { schema: "koreabylocal" } },
  );

  const { data: ebook, error: ebookError } = await supabase
    .from("ebooks")
    .select("id, title, price_usd")
    .eq("id", ebookId)
    .eq("is_active", true)
    .maybeSingle();

  if (ebookError || !ebook) return json({ error: "E-book not found" }, 404);

  // Safety: this endpoint can never become a way to skip payment on a priced book.
  if (Number(ebook.price_usd) !== 0) {
    console.error("claim-free-ebook: refused — book is not free:", ebookId, ebook.price_usd);
    return json({ error: "This e-book isn't free" }, 422);
  }

  // Best-effort lead capture; a duplicate email is not an error.
  const { error: subError } = await supabase
    .from("subscribers")
    .insert({ email, source: "ebook_free_claim", lead_magnet: "ebook_free" });
  if (subError && !subError.message.toLowerCase().includes("duplicate")) {
    console.error("claim-free-ebook: subscriber insert failed:", subError.message);
  }

  const { data: purchase, error: insertError } = await supabase
    .from("ebook_purchases")
    .insert({
      ebook_id: ebook.id,
      buyer_email: email,
      buyer_name: name,
      payment_provider: "free",
      payment_key: `free-${crypto.randomUUID()}`,
      amount: 0,
      currency: "USD",
      status: "completed",
      download_token: generateDownloadToken(),
      paid_at: new Date().toISOString(),
    })
    .select("download_token, max_downloads")
    .single();

  if (insertError || !purchase) {
    console.error("claim-free-ebook: failed to record claim:", insertError?.message);
    return json({ error: "Couldn't process your request. Please try again." }, 500);
  }

  // Best-effort: the page already shows the download button on success.
  const { subject, html } = buildFreeDeliveryEmail({
    title: ebook.title,
    buyerName: name,
    downloadUrl: `${SITE_URL}/ebook/download/${purchase.download_token}`,
    maxDownloads: purchase.max_downloads,
    siteUrl: SITE_URL,
  });
  const sent = await sendMail({ to: email, subject, html });
  if (!sent.ok) console.error("claim-free-ebook: delivery email failed:", sent.error);

  return json({ success: true, download_token: purchase.download_token });
});
