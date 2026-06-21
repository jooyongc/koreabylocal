import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@koreabylocal.com";

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
    const { email, magazineId } = await req.json();

    if (!email || !magazineId) {
      return new Response(
        JSON.stringify({ error: "email and magazineId are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { db: { schema: "koreabylocal" } },
    );

    // Fetch magazine info
    const { data: magazine, error: magError } = await supabase
      .from("digital_magazines")
      .select("*")
      .eq("id", magazineId)
      .single();

    if (magError || !magazine) {
      return new Response(
        JSON.stringify({ error: "Magazine not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Increment download count
    await supabase
      .from("digital_magazines")
      .update({ download_count: (magazine.download_count ?? 0) + 1 })
      .eq("id", magazineId);

    // Send download link email if Resend is configured
    if (RESEND_API_KEY && email) {
      const emailHtml = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <div style="background:linear-gradient(135deg,#00005a,#6312ff);padding:32px;text-align:center;border-radius:12px 12px 0 0">
            <h1 style="color:#fff;margin:0;font-size:24px">Korea By Local</h1>
            <p style="color:rgba(255,255,255,.8);margin:8px 0 0;font-size:14px">Digital Magazine</p>
          </div>
          <div style="border:1px solid #e5e7eb;border-top:none;padding:32px;border-radius:0 0 12px 12px">
            <h2 style="color:#00005a;margin:0 0 8px;font-size:20px">${magazine.title}</h2>
            <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px">
              Thank you for your interest in our digital magazine! Click the button below to download your free copy.
            </p>
            ${
              magazine.file_url
                ? `<a href="${magazine.file_url}" style="display:inline-block;background:#00005a;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Download Magazine (PDF)</a>`
                : `<p style="color:#6b7280;font-size:14px">The download link will be available soon.</p>`
            }
            <p style="margin-top:32px;color:#9ca3af;font-size:12px">Korea By Local - Korean Local Travel Contents</p>
          </div>
        </div>
      `;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [email],
          subject: `[Korea By Local] Download: ${magazine.title}`,
          html: emailHtml,
        }),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        file_url: magazine.file_url,
        title: magazine.title,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (_err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
