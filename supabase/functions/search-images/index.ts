// Stock image search (Unsplash + Pexels) for the admin image picker. Admin-only.
// Keeps the API keys server-side. Returns normalized results.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

interface Img { url: string; thumb: string; alt: string; credit: string; source: string }

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const UNSPLASH = Deno.env.get("UNSPLASH_ACCESS_KEY");
  const PEXELS = Deno.env.get("PEXELS_API_KEY");

  const svc = createClient(SUPABASE_URL, SERVICE, { db: { schema: "koreabylocal" }, auth: { persistSession: false } });
  const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  if (!jwt) return json({ error: "unauthorized" }, 401);
  const { data: u } = await svc.auth.getUser(jwt);
  if (!u?.user) return json({ error: "unauthorized" }, 401);
  const { data: prof } = await svc.from("profiles").select("role").eq("id", u.user.id).maybeSingle();
  if (prof?.role !== "admin") return json({ error: "forbidden" }, 403);

  let body: { query?: string; orientation?: string } = {};
  try { body = await req.json(); } catch { /* */ }
  const query = (body.query || "").trim();
  if (!query) return json({ error: "query_required" }, 400);
  const orientation = body.orientation === "portrait" || body.orientation === "squarish" ? body.orientation : "landscape";
  const q = encodeURIComponent(query);

  const images: Img[] = [];

  if (UNSPLASH) {
    try {
      const r = await fetch(
        `https://api.unsplash.com/search/photos?query=${q}&per_page=14&orientation=${orientation}&content_filter=high`,
        { headers: { Authorization: `Client-ID ${UNSPLASH}` } },
      );
      if (r.ok) {
        for (const p of (await r.json())?.results ?? []) {
          if (!p?.urls?.raw) continue;
          images.push({
            url: `${p.urls.raw}&w=1600&q=80&fit=crop`,
            thumb: p.urls.small ?? `${p.urls.raw}&w=320&q=60&fit=crop`,
            alt: p.alt_description ?? query,
            credit: `Unsplash · ${p.user?.name ?? ""}`.trim(),
            source: "unsplash",
          });
        }
      }
    } catch { /* */ }
  }

  if (PEXELS) {
    try {
      const o = orientation === "squarish" ? "square" : orientation;
      const r = await fetch(
        `https://api.pexels.com/v1/search?query=${q}&per_page=10&orientation=${o}`,
        { headers: { Authorization: PEXELS } },
      );
      if (r.ok) {
        for (const p of (await r.json())?.photos ?? []) {
          const src = p?.src;
          if (!src) continue;
          images.push({
            url: src.large2x ?? src.large ?? src.original,
            thumb: src.medium ?? src.small ?? src.tiny,
            alt: p.alt ?? query,
            credit: `Pexels · ${p.photographer ?? ""}`.trim(),
            source: "pexels",
          });
        }
      }
    } catch { /* */ }
  }

  if (!UNSPLASH && !PEXELS) return json({ error: "no_image_provider_configured" }, 400);
  return json({ success: true, images });
});
