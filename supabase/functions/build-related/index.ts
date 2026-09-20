// Works out what to recommend under one article and stores it on the row.
//
// Admin-only, and safe to re-run: the whole bundle is replaced each time, so a
// post edited months later gets a fresh set rather than an accumulation.
//
// Called with { post_id } for one article. The bulk pass over the existing
// archive lives in scripts/backfill-related.ts.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildRelated, type Candidate } from "../_shared/related.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

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

  let body: { post_id?: number } = {};
  try { body = await req.json(); } catch { /* validated below */ }
  const postId = Number(body.post_id);
  if (!postId) return json({ error: "missing_post_id" }, 400);

  const { data: article } = await svc
    .from("blog_posts")
    .select("id, slug, title, excerpt")
    .eq("id", postId)
    .maybeSingle();
  if (!article) return json({ error: "not_found" }, 404);

  // Only things a reader can actually reach: published posts, live spots.
  const [{ data: posts }, { data: spots }, { data: products }] = await Promise.all([
    svc.from("blog_posts").select("slug, title, excerpt").eq("status", "published").neq("id", postId),
    svc.from("experiences").select("slug, title, tagline").eq("is_active", true),
    svc.from("products").select("slug, title, description"),
  ]);

  const candidates: Candidate[] = [
    ...(posts ?? []).map((p: { slug: string; title: string; excerpt: string | null }) =>
      ({ kind: "posts" as const, slug: p.slug, title: p.title, summary: p.excerpt })),
    ...(spots ?? []).map((s: { slug: string; title: string; tagline: string | null }) =>
      ({ kind: "spots" as const, slug: s.slug, title: s.title, summary: s.tagline })),
    ...(products ?? []).map((p: { slug: string; title: string; description: string | null }) =>
      ({ kind: "products" as const, slug: p.slug, title: p.title, summary: p.description })),
  ];

  const related = await buildRelated(article, candidates);
  if (!related) return json({ error: "judgement_unavailable" }, 503);

  const { error } = await svc.from("blog_posts").update({ related }).eq("id", postId);
  if (error) return json({ error: "save_failed", detail: error.message }, 500);

  return json({ success: true, related });
});
