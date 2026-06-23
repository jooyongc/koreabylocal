// Content Studio — server-side AI article generation.
// Admin-only. Generates a draft article in the Korea by Local author voice,
// optimized for AEO/SEO/GEO, and saves it as a blog_posts DRAFT + a content_jobs row.
//
// REQUIRED secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// Optional:         CONTENT_MODEL (default claude-haiku-4-5-20251001)
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const VOICE = `You are the writer behind koreabylocal.com — a warm, enthusiastic KOREAN LOCAL HOST writing for travelers. First person ("I", "we locals"). Friendly, excited, generous with practical insider tips.
Voice habits: open with a warm hook (a Korean greeting + gloss is welcome, e.g. "Annyeong (hello)!"); Korean terms with English in parentheses on first mention (e.g. "Hangang (the Han River)"); direct "you" address; "as a local / what locals actually do" framing; tasteful emphasis (bold key facts; at most one "!" per section). Vocabulary: must-visit, hidden gem, beating heart, one-of-a-kind, vibrant. Warm closer + a gentle CTA.`;

const IMAGE_POOL = [
  ["seoul/city/general", "https://images.unsplash.com/photo-1538485399081-7191377e8241?w=1600&q=80"],
  ["food/street food/market", "https://images.unsplash.com/photo-1532347231146-80afc9e3df2b?w=1600&q=80"],
  ["busan/coast", "https://images.unsplash.com/photo-1546874177-9e664107314e?w=1600&q=80"],
  ["jeju/nature/hiking", "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=1600&q=80"],
  ["heritage/palace/temple/hanbok", "https://images.unsplash.com/photo-1535139262971-c51845709a48?w=1600&q=80"],
  ["transport/train/ktx/transfer", "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1600&q=80"],
  ["nightlife/bars/euljiro", "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1600&q=80"],
  ["kpop/concert/culture", "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1600&q=80"],
  ["beauty/kbeauty/shopping", "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1600&q=80"],
  ["festival/celebration", "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1600&q=80"],
];

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 64);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANTHROPIC = Deno.env.get("ANTHROPIC_API_KEY");
  const MODEL = Deno.env.get("CONTENT_MODEL") || "claude-haiku-4-5-20251001";

  const svc = createClient(SUPABASE_URL, SERVICE, {
    db: { schema: "koreabylocal" },
    auth: { persistSession: false },
  });

  // ── Admin gate ──
  const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  if (!jwt) return json({ error: "unauthorized" }, 401);
  const { data: userData } = await svc.auth.getUser(jwt);
  if (!userData?.user) return json({ error: "unauthorized" }, 401);
  const { data: prof } = await svc.from("profiles").select("role").eq("id", userData.user.id).maybeSingle();
  if (prof?.role !== "admin") return json({ error: "forbidden" }, 403);

  if (!ANTHROPIC) return json({ error: "ANTHROPIC_API_KEY not configured (supabase secrets set ANTHROPIC_API_KEY=...)" }, 400);

  let body: { topic?: string; keywords?: string[]; tone?: string; publish?: boolean };
  try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
  const topic = (body.topic || "").trim();
  if (!topic) return json({ error: "topic_required" }, 400);
  const keywords = Array.isArray(body.keywords) ? body.keywords : [];
  const tone = body.tone === "editorial" ? "editorial" : "informative";

  const prompt = `${VOICE}

Write a NEW article for koreabylocal.com about: "${topic}".
Target keywords (work in naturally): ${keywords.join(", ") || "(none)"}.
Tone: ${tone}.

OPTIMIZE for AEO / SEO / GEO and match this exact structure:
- Open with <p><strong>Quick answer:</strong> …</p> directly answering the topic, key facts in <strong>.
- Then the article in the local-host voice: <h2> section headings, <ul>/<ol>, a <table> if dates/prices/routes apply, one <blockquote> local pro-tip.
- End with <h2>Frequently asked questions</h2> with 3–5 <h3>question</h3><p>answer</p> pairs.
- Internal CTA links: <a href="/tours"> or <a href="/ask-a-local"> where natural.
- HTML only for "content": no inline styles, no wrapper div, no <h1> (the title is separate). Do not invent precise figures you are unsure of.

Pick the most relevant hero image URL from this pool (theme → url):
${IMAGE_POOL.map(([t, u]) => `- ${t}: ${u}`).join("\n")}

Respond with ONLY a JSON object (no markdown fences):
{"title": "...", "category": "City Guide|Food|Itinerary|Culture|Transport|Nature|News", "seo_title": "<=60 chars", "seo_description": "<=160 chars", "excerpt": "1-2 sentences", "hero_image_url": "<one url from the pool>", "content": "<HTML>", "faqs": [{"q":"...","a":"..."}]}`;

  // ── Anthropic ──
  let article: Record<string, unknown>;
  try {
    const ai = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": ANTHROPIC, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 8000, messages: [{ role: "user", content: prompt }] }),
    });
    if (!ai.ok) return json({ error: "ai_error", detail: (await ai.text()).slice(0, 300) }, 502);
    const data = await ai.json();
    let text: string = data?.content?.[0]?.text ?? "";
    text = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    const start = text.indexOf("{"), end = text.lastIndexOf("}");
    article = JSON.parse(text.slice(start, end + 1));
  } catch (e) {
    return json({ error: "ai_parse_failed", detail: String((e as Error).message) }, 502);
  }

  const title = String(article.title || topic).slice(0, 200);
  const content = String(article.content || "");
  const faqs = Array.isArray(article.faqs) ? article.faqs : [];
  const clip = (s: unknown, n: number) => (s ? String(s).slice(0, n) : null);

  // ── Save draft blog post + content_jobs row ──
  const slug = `${slugify(title)}-${Date.now().toString(36).slice(-4)}`;
  const { data: post, error: postErr } = await svc
    .from("blog_posts")
    .insert({
      title, slug,
      content,
      excerpt: clip(article.excerpt, 400),
      category: String(article.category || "News"),
      author: "Korea by Local",
      status: body.publish ? "published" : "draft",
      seo_title: clip(article.seo_title, 60),
      seo_description: clip(article.seo_description, 160),
      hero_image_url: typeof article.hero_image_url === "string" ? article.hero_image_url : null,
      faqs,
      published_at: body.publish ? new Date().toISOString() : null,
    })
    .select("id, slug, title")
    .single();
  if (postErr) return json({ error: "save_failed", detail: postErr.message }, 500);

  const wordCount = content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  const linksCount = (content.match(/<a\s/g) || []).length;
  await svc.from("content_jobs").insert({
    topic, keywords, tone,
    status: body.publish ? "published" : "ready",
    category: String(article.category || "News"),
    word_count: wordCount, links_count: linksCount,
    model: MODEL, generated_title: title, blog_post_id: post.id,
  });

  return json({ success: true, post });
});
