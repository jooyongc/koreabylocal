import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SIGNED_URL_TTL_SECONDS = 300;

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
    const { token } = await req.json();
    if (!token) {
      return new Response(JSON.stringify({ error: "token is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { db: { schema: "koreabylocal" } },
    );

    const { data: purchase, error: purchaseError } = await supabase
      .from("ebook_purchases")
      .select("id, ebook_id, status, download_count, max_downloads")
      .eq("download_token", token)
      .maybeSingle();

    if (purchaseError || !purchase || purchase.status !== "completed") {
      return new Response(
        JSON.stringify({ error: "This download link is no longer valid." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (purchase.download_count >= purchase.max_downloads) {
      return new Response(
        JSON.stringify({ error: "This download link has reached its download limit." }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: ebook, error: ebookError } = await supabase
      .from("ebooks")
      .select("file_url")
      .eq("id", purchase.ebook_id)
      .maybeSingle();

    if (ebookError || !ebook?.file_url) {
      console.error("download-ebook: e-book file not configured", purchase.ebook_id);
      return new Response(
        JSON.stringify({ error: "This file isn't available right now. Please contact support." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: signed, error: signError } = await supabase.storage
      .from("ebooks")
      .createSignedUrl(ebook.file_url, SIGNED_URL_TTL_SECONDS);

    if (signError || !signed) {
      console.error("download-ebook: failed to sign URL:", signError?.message);
      return new Response(
        JSON.stringify({ error: "Couldn't prepare your download. Please try again shortly." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    await supabase
      .from("ebook_purchases")
      .update({ download_count: purchase.download_count + 1 })
      .eq("id", purchase.id);

    return new Response(JSON.stringify({ url: signed.signedUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("download-ebook failed:", err instanceof Error ? err.message : err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
