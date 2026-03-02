import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = Deno.env.get("SITE_URL") || "https://koreabylocal.com";

Deno.serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Fetch all active products
  const { data: products } = await supabase
    .from("products")
    .select("slug, updated_at")
    .eq("status", "active")
    .order("updated_at", { ascending: false });

  // Fetch all published blog posts
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, updated_at, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  // Fetch active categories
  const { data: categories } = await supabase
    .from("categories")
    .select("slug")
    .eq("is_active", true)
    .order("sort_order");

  // Build XML
  const urls: string[] = [];

  // Static pages
  const staticPages = [
    { loc: "/", priority: "1.0", changefreq: "daily" },
    { loc: "/shop", priority: "0.9", changefreq: "daily" },
    { loc: "/blog", priority: "0.8", changefreq: "daily" },
    { loc: "/about", priority: "0.5", changefreq: "monthly" },
    { loc: "/contact", priority: "0.5", changefreq: "monthly" },
  ];

  for (const page of staticPages) {
    urls.push(`
  <url>
    <loc>${SITE_URL}${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
  }

  // Category pages
  if (categories) {
    for (const cat of categories) {
      urls.push(`
  <url>
    <loc>${SITE_URL}/category/${cat.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
    }
  }

  // Product pages
  if (products) {
    for (const product of products) {
      const lastmod = product.updated_at
        ? new Date(product.updated_at).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];
      urls.push(`
  <url>
    <loc>${SITE_URL}/product/${product.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
    }
  }

  // Blog post pages
  if (posts) {
    for (const post of posts) {
      const lastmod = post.updated_at
        ? new Date(post.updated_at).toISOString().split("T")[0]
        : post.published_at
          ? new Date(post.published_at).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];
      urls.push(`
  <url>
    <loc>${SITE_URL}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
    }
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
