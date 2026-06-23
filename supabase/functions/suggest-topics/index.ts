// Content Studio — AEO/SEO/GEO topic suggestions (admin-only).
// Suggests article topics tuned for answer engines + search + generative engines,
// avoiding duplicates of existing posts. No DB writes.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const SCHEMA = {
  type: "object",
  properties: {
    topics: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Compelling article title" },
          keywords: { type: "array", items: { type: "string" } },
          intent: { type: "string", description: "search intent: informational | transactional | navigational" },
          category: { type: "string" },
          rationale: { type: "string", description: "one line: why it wins for AEO/SEO/GEO" },
        },
        required: ["title", "keywords", "intent", "category", "rationale"],
      },
    },
  },
  required: ["topics"],
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANTHROPIC = Deno.env.get("ANTHROPIC_API_KEY");
  const GEMINI = Deno.env.get("GEMINI_API_KEY");
  const MODEL = Deno.env.get("CONTENT_MODEL") || "claude-haiku-4-5-20251001";
  const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash";

  const svc = createClient(SUPABASE_URL, SERVICE, { db: { schema: "koreabylocal" }, auth: { persistSession: false } });

  const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  if (!jwt) return json({ error: "unauthorized" }, 401);
  const { data: u } = await svc.auth.getUser(jwt);
  if (!u?.user) return json({ error: "unauthorized" }, 401);
  const { data: prof } = await svc.from("profiles").select("role").eq("id", u.user.id).maybeSingle();
  if (prof?.role !== "admin") return json({ error: "forbidden" }, 403);
  if (!ANTHROPIC && !GEMINI) return json({ error: "No AI key configured" }, 400);

  let body: { focus?: string; count?: number } = {};
  try { body = await req.json(); } catch { /* defaults */ }
  const count = Math.min(Math.max(Number(body.count) || 6, 3), 10);
  const focus = (body.focus || "").trim();

  // Existing titles → avoid duplicates / find gaps.
  const { data: existing } = await svc.from("blog_posts").select("title").limit(80);
  const titles = (existing ?? []).map((r: { title: string }) => `- ${r.title}`).join("\n");

  const prompt = `You are an SEO / AEO / GEO content strategist for koreabylocal.com — a Korea travel magazine written by local hosts (practical, first-person, traveler-focused).

Suggest ${count} NEW article topics optimized for:
- AEO (answer engines): clear question-style topics that can be answered directly (featured-snippet / AI-overview potential).
- SEO: real search demand, specific long-tail keywords.
- GEO (generative engines): citable, specific, up-to-date angles.
${focus ? `Focus area: ${focus}.` : "Cover a useful spread across Seoul/Busan/Jeju, food, transport, culture, K-pop, seasonal, practical how-tos."}

Do NOT duplicate these existing posts:
${titles || "(none yet)"}

For each topic give: a compelling title, 3-5 target keywords, the search intent, a category (City Guide|Food|Itinerary|Culture|Transport|Nature|K-pop|News), and a one-line rationale for why it wins (e.g. high-intent question, seasonal gap, snippet potential).`;

  let topics: unknown[];
  try {
    if (ANTHROPIC) {
      const ai = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": ANTHROPIC, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({
          model: MODEL, max_tokens: 3000,
          tools: [{ name: "suggest", description: "Return topic ideas.", input_schema: SCHEMA }],
          tool_choice: { type: "tool", name: "suggest" },
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!ai.ok) return json({ error: "ai_error", detail: (await ai.text()).slice(0, 300) }, 502);
      const tool = ((await ai.json())?.content ?? []).find((c: { type: string }) => c.type === "tool_use");
      topics = (tool?.input as { topics?: unknown[] })?.topics ?? [];
    } else {
      const ai = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI}`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 3000, responseMimeType: "application/json", responseSchema: SCHEMA } }),
      });
      if (!ai.ok) return json({ error: "ai_error", detail: (await ai.text()).slice(0, 300) }, 502);
      const txt = (await ai.json())?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
      topics = (JSON.parse(txt)?.topics) ?? [];
    }
  } catch (e) {
    return json({ error: "ai_parse_failed", detail: String((e as Error).message) }, 502);
  }

  return json({ success: true, topics });
});
