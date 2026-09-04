import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const COOLDOWN_MINUTES = 5;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
    const { type, id } = await req.json();

    if (!type || !id || !["product", "blog", "spot"].includes(type)) {
      return new Response(
        JSON.stringify({ error: "Invalid params. Need type (product|blog|spot) and id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Hash the client IP for privacy
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("cf-connecting-ip")
      || "unknown";
    const encoder = new TextEncoder();
    const data = encoder.encode(clientIp + (Deno.env.get("IP_HASH_SALT") ?? "kbl-salt"));
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const ipHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Service role client for bypassing RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { db: { schema: "koreabylocal" } },
    );

    // Check rate limit: same IP + target within 5 minutes
    const cutoff = new Date(Date.now() - COOLDOWN_MINUTES * 60 * 1000).toISOString();
    const { data: recentView } = await supabase
      .from("view_logs")
      .select("id")
      .eq("target_type", type)
      .eq("target_id", id)
      .eq("ip_hash", ipHash)
      .gte("viewed_at", cutoff)
      .limit(1)
      .maybeSingle();

    if (recentView) {
      return new Response(
        JSON.stringify({ success: true, incremented: false, reason: "rate_limited" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the view
    await supabase.from("view_logs").insert({
      target_type: type,
      target_id: id,
      ip_hash: ipHash,
    });

    // Increment view count
    const table = type === "product" ? "products" : type === "spot" ? "experiences" : "blog_posts";
    const { error } = await supabase.rpc("increment_view_count", {
      table_name: table,
      row_id: id,
    });

    if (error) {
      // View counting is best-effort; log and continue (don't fail the request).
      console.error("increment_view_count failed:", error.message);
    }

    // Periodic cleanup (1% chance per request)
    if (Math.random() < 0.01) {
      await supabase.rpc("cleanup_old_view_logs");
    }

    return new Response(
      JSON.stringify({ success: true, incremented: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
