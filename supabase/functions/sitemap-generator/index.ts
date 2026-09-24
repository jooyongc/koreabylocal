// The sitemap, served at /sitemap.xml through the Pages middleware.
//
// Only final URLs belong here. The previous version listed the pre-renewal
// paths — /blog/<slug>, /product/<slug>, /shop*, /tours, /transfers* — and 68
// of its 76 entries answered 301, which wastes crawl budget and fills Search
// Console with "page with redirect". It also listed /category/<slug>, for
// which no route exists, so those were soft 404s, and it left out the 40 spot
// pages entirely.
//
// Anything added here must be a path that answers 200 and renders real
// content. When a section is renamed, this file changes with it.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = Deno.env.get("SITE_URL") || "https://koreabylocal.com";

const day = (...candidates: Array<string | null | undefined>) => {
  const found = candidates.find(Boolean);
  return new Date(found ?? Date.now()).toISOString().split("T")[0];
};

const entry = (loc: string, opts: { lastmod?: string; changefreq: string; priority: string }) => `
  <url>
    <loc>${SITE_URL}${loc}</loc>${opts.lastmod ? `
    <lastmod>${opts.lastmod}</lastmod>` : ""}
    <changefreq>${opts.changefreq}</changefreq>
    <priority>${opts.priority}</priority>
  </url>`;

Deno.serve(async (_req: Request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { db: { schema: "koreabylocal" } },
  );

  const [postsRes, spotsRes, regionsRes] = await Promise.all([
    supabase.from("blog_posts").select("slug, updated_at, published_at")
      .eq("status", "published").order("published_at", { ascending: false }),
    supabase.from("experiences").select("slug, updated_at")
      .eq("is_active", true).order("updated_at", { ascending: false }),
    // Regions are keyed by `key`, not `slug` — /destinations/:region takes the key.
    supabase.from("regions").select("key").eq("is_active", true).order("sort_order"),
  ]);

  // Logged rather than swallowed: a query that fails here drops a whole section
  // out of the sitemap, and an empty section looks exactly like a correct one.
  for (const [name, res] of [["blog_posts", postsRes], ["experiences", spotsRes], ["regions", regionsRes]] as const) {
    if (res.error) console.error(`sitemap-generator: ${name} query failed: ${res.error.message}`);
  }

  const posts = postsRes.data;
  const spots = spotsRes.data;
  const regions = regionsRes.data;

  const urls: string[] = [];

  // Every one of these is a route in App.tsx that renders a real page. The
  // shop is switched off, so nothing under /shop, /product or /cart is here.
  for (const page of [
    { loc: "/", priority: "1.0", changefreq: "daily" },
    { loc: "/guidebook", priority: "0.9", changefreq: "daily" },
    { loc: "/experiences", priority: "0.9", changefreq: "weekly" },
    { loc: "/getting-there", priority: "0.7", changefreq: "weekly" },
    { loc: "/getting-there/transportation", priority: "0.7", changefreq: "weekly" },
    { loc: "/getting-there/tour-planning", priority: "0.7", changefreq: "weekly" },
    { loc: "/ask-a-local", priority: "0.6", changefreq: "monthly" },
    { loc: "/ebook", priority: "0.6", changefreq: "monthly" },
    { loc: "/about", priority: "0.5", changefreq: "monthly" },
    { loc: "/privacy", priority: "0.2", changefreq: "yearly" },
    { loc: "/terms", priority: "0.2", changefreq: "yearly" },
  ]) {
    urls.push(entry(page.loc, { changefreq: page.changefreq, priority: page.priority }));
  }

  for (const region of regions ?? []) {
    urls.push(entry(`/destinations/${region.key}`, { changefreq: "weekly", priority: "0.7" }));
  }

  // The articles, at the URL they actually live at.
  for (const post of posts ?? []) {
    urls.push(entry(`/guidebook/${post.slug}`, {
      lastmod: day(post.updated_at, post.published_at),
      changefreq: "monthly",
      priority: "0.8",
    }));
  }

  // Bookable spots — real pages that were missing from the sitemap entirely.
  for (const spot of spots ?? []) {
    urls.push(entry(`/spots/${spot.slug}`, {
      lastmod: day(spot.updated_at),
      changefreq: "weekly",
      priority: "0.7",
    }));
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
});
