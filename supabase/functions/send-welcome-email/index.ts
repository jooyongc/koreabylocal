import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "hello@koreabylocal.com";
const SITE_URL = Deno.env.get("SITE_URL") || "https://koreabylocal.com";
const CHECKLIST_PDF_URL =
  Deno.env.get("CHECKLIST_PDF_URL") || `${SITE_URL}/downloads/korea-travel-checklist.pdf`;
const EBOOK_SAMPLE_PDF_URL =
  Deno.env.get("EBOOK_SAMPLE_PDF_URL") || `${SITE_URL}/downloads/korea-ebook-sample.pdf`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface WelcomePayload {
  email: string;
  name: string | null;
  leadMagnet: string | null;
}

// Accepts either a direct call from the frontend right after a successful
// `subscribers` insert (`{ email, name?, lead_magnet? }`), or a Supabase
// Database Webhook payload if one is later wired up on the subscribers
// table's INSERT event (`{ type: "INSERT", table: "subscribers", record }`).
function parsePayload(body: Record<string, unknown>): WelcomePayload | null {
  const record = (body.record as Record<string, unknown>) ?? body;
  const email = record.email;
  if (typeof email !== "string" || !email.includes("@")) return null;
  const name = typeof record.name === "string" ? record.name : null;
  const leadMagnet = typeof record.lead_magnet === "string" ? record.lead_magnet : null;
  return { email, name, leadMagnet };
}

function wrapEmail(preheader: string, bodyHtml: string): string {
  return `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;background:#fff">
      <span style="display:none;max-height:0;overflow:hidden">${preheader}</span>
      <div style="background:#1a1a1a;padding:28px 32px;text-align:center;border-radius:14px 14px 0 0">
        <span style="font-size:22px;font-weight:800;color:#fff">Korea</span>
        <span style="font-size:18px;font-style:italic;color:#fff;padding:0 3px">by</span>
        <span style="font-size:22px;font-weight:800;color:#ff6b35">Local</span>
      </div>
      <div style="border:1px solid #eee;border-top:none;padding:32px;border-radius:0 0 14px 14px">
        ${bodyHtml}
        <p style="margin-top:32px;padding-top:20px;border-top:1px solid #eee;color:#9ca3af;font-size:12px;line-height:1.6">
          You're receiving this because you subscribed at koreabylocal.com.
          Korea by Local — authentic Korean travel, from real locals.
        </p>
      </div>
    </div>
  `;
}

function buttonHtml(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#ff6b35;color:#fff;padding:13px 30px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14.5px">${label}</a>`;
}

function buildEmail(payload: WelcomePayload): { subject: string; html: string } {
  const greeting = payload.name ? `Hi ${payload.name},` : "Hi there,";

  if (payload.leadMagnet === "checklist") {
    return {
      subject: "Your free Korea travel checklist is here 🇰🇷",
      html: wrapEmail(
        "Your free Korea travel checklist, ready to download.",
        `
          <h1 style="margin:0 0 12px;font-size:21px;color:#1a1a1a">Your checklist is ready!</h1>
          <p style="margin:0 0 22px;font-size:14.5px;line-height:1.7;color:#4b5563">
            ${greeting} thanks for signing up. Here's your free, locally-made Korea travel checklist —
            everything to sort out before you land, from SIM cards to must-try dishes.
          </p>
          ${buttonHtml(CHECKLIST_PDF_URL, "Download the checklist (PDF)")}
          <p style="margin:26px 0 0;font-size:13.5px;line-height:1.7;color:#6b7280">
            While you're at it, browse our <a href="${SITE_URL}" style="color:#ff6b35;font-weight:600">curated local spots</a>
            or say hi on <a href="${SITE_URL}/ask-a-local" style="color:#ff6b35;font-weight:600">Ask a Local</a>.
          </p>
        `,
      ),
    };
  }

  if (payload.leadMagnet === "ebook_sample") {
    return {
      subject: "Here's your free e-book sample (2 chapters) 📖",
      html: wrapEmail(
        "Your free 2-chapter e-book sample, ready to download.",
        `
          <h1 style="margin:0 0 12px;font-size:21px;color:#1a1a1a">Enjoy your free sample!</h1>
          <p style="margin:0 0 22px;font-size:14.5px;line-height:1.7;color:#4b5563">
            ${greeting} here are the first two chapters of our Korea e-book, written by locals who
            actually live it. If you like what you read, the full guide is waiting for you.
          </p>
          ${buttonHtml(EBOOK_SAMPLE_PDF_URL, "Download the sample (PDF)")}
          <p style="margin:26px 0 0;font-size:13.5px;line-height:1.7;color:#6b7280">
            Ready for the whole thing? <a href="${SITE_URL}/ebook" style="color:#ff6b35;font-weight:600">Get the full e-book →</a>
          </p>
        `,
      ),
    };
  }

  return {
    subject: "Welcome to Korea by Local 👋",
    html: wrapEmail(
      "Welcome — Korea travel tips from real locals, in your inbox.",
      `
        <h1 style="margin:0 0 12px;font-size:21px;color:#1a1a1a">Welcome aboard!</h1>
        <p style="margin:0 0 22px;font-size:14.5px;line-height:1.7;color:#4b5563">
          ${greeting} you're now on the list for Korea travel tips, curated local spots, and the
          occasional good deal — straight from people who actually live here.
        </p>
        ${buttonHtml(SITE_URL, "Start exploring")}
      `,
    ),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const payload = parsePayload(body);

    if (!payload) {
      return new Response(JSON.stringify({ error: "email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!RESEND_API_KEY) {
      console.error("send-welcome-email: RESEND_API_KEY is not configured");
      return new Response(JSON.stringify({ skipped: true, reason: "email_not_configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subject, html } = buildEmail(payload);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [payload.email],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      console.error("send-welcome-email: Resend request failed:", res.status, await res.text());
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-welcome-email failed:", err instanceof Error ? err.message : err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
