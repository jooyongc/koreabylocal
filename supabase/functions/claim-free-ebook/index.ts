// Gives away an e-book priced at $0. PayPal will not open an order for
// nothing, so a free book skips checkout: the reader leaves an email address
// instead. It joins the newsletter list, like every other free download on the
// site, and the download link comes back on screen and by email.
//
// The browser is not trusted on price: only a book that is active and $0 in
// the database is given away here. Paid books go through
// create-ebook-checkout / capture-ebook-payment.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildDeliveryEmail, generateDownloadToken } from "../_shared/ebook-order.ts";
import { sendMail } from "../_shared/gmail.ts";

const SITE_URL = Deno.env.get("SITE_URL") || "https://koreabylocal.com";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let ebookId: number;
  let email: string;
  try {
    const body = await req.json();
    ebookId = Number(body?.ebook_id);
    email = String(body?.email ?? "").trim().toLowerCase();
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  if (!ebookId) return json({ error: "ebook_id is required" }, 400);
  if (email.length > 254 || !EMAIL.test(email)) return json({ error: "A valid email is required" }, 400);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { db: { schema: "koreabylocal" } },
  );

  const { data: ebook } = await supabase
    .from("ebooks")
    .select("id, title, price_usd")
    .eq("id", ebookId)
    .eq("is_active", true)
    .maybeSingle();
  if (!ebook) return json({ error: "E-book not found" }, 404);
  if (Number(ebook.price_usd) > 0) return json({ error: "This e-book isn't free" }, 402);

  // The list is the point of a free download, but never at the cost of the
  // download itself.
  const { error: subscribeError } = await supabase.rpc("subscribe", {
    p_email: email,
    p_source: "ebook_page",
    p_lead_magnet: "free_ebook",
  });
  if (subscribeError) console.error("claim-free-ebook: subscribe failed:", subscribeError.message);

  // Asking again with the same address hands back the same link while it still
  // has downloads left, rather than minting a new one and another email.
  const { data: existing } = await supabase
    .from("ebook_purchases")
    .select("download_token, download_count, max_downloads")
    .eq("ebook_id", ebook.id)
    .eq("buyer_email", email)
    .eq("payment_provider", "free")
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing && existing.download_count < existing.max_downloads) {
    return json({ download_token: existing.download_token, already_claimed: true });
  }

  const { data: claim, error: insertError } = await supabase
    .from("ebook_purchases")
    .insert({
      ebook_id: ebook.id,
      buyer_email: email,
      payment_provider: "free",
      amount: 0,
      currency: "USD",
      status: "completed",
      download_token: generateDownloadToken(),
      paid_at: new Date().toISOString(),
    })
    .select("download_token, max_downloads")
    .single();
  if (insertError || !claim) {
    console.error("claim-free-ebook: insert failed:", insertError?.message);
    return json({ error: "Could not prepare your download. Please try again." }, 500);
  }

  // Best-effort: the page already has the download.
  const { subject, html } = buildDeliveryEmail({
    title: ebook.title,
    buyerName: null,
    downloadUrl: `${SITE_URL}/ebook/download/${claim.download_token}`,
    maxDownloads: claim.max_downloads,
    siteUrl: SITE_URL,
    free: true,
  });
  const sent = await sendMail({ to: email, subject, html });
  if (!sent.ok) console.error("claim-free-ebook: delivery email failed:", sent.error);

  return json({ download_token: claim.download_token });
});
