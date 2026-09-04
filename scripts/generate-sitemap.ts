/**
 * Generates public/sitemap.xml from live content: published blog_posts,
 * active experiences (spots) and active regions. Run with `npm run sitemap`
 * (needs VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — the same anon key the
 * site itself uses is enough, since these are exactly the rows anon can
 * already read).
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  process.loadEnvFile(path.resolve(__dirname, "../.env"));
} catch {
  // No .env file — fall back to whatever is already in the environment.
}

const SITE_URL = process.env.VITE_SITE_URL ?? "https://koreabylocal.com";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Add them to .env (see .env.example) before running `npm run sitemap`.",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: "koreabylocal" },
});

interface UrlEntry {
  loc: string;
  lastmod?: string;
  changefreq: "daily" | "weekly";
}

function toDateOnly(value: string | null | undefined): string | undefined {
  return value ? value.slice(0, 10) : undefined;
}

async function fetchBlogPostUrls(): Promise<UrlEntry[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("slug, updated_at, published_at")
    .eq("status", "published");
  if (error) throw error;

  return (data ?? []).map((post) => ({
    loc: `${SITE_URL}/guidebook/${post.slug}`,
    lastmod: toDateOnly(post.updated_at ?? post.published_at),
    changefreq: "weekly",
  }));
}

async function fetchSpotUrls(): Promise<UrlEntry[]> {
  const { data, error } = await supabase
    .from("experiences")
    .select("slug, updated_at, created_at")
    .eq("is_active", true);
  if (error) throw error;

  return (data ?? []).map((spot) => ({
    loc: `${SITE_URL}/spots/${spot.slug}`,
    lastmod: toDateOnly(spot.updated_at ?? spot.created_at),
    changefreq: "weekly",
  }));
}

async function fetchRegionUrls(): Promise<UrlEntry[]> {
  const { data, error } = await supabase.from("regions").select("key").eq("is_active", true);
  if (error) throw error;

  // regions has no timestamp columns, so these entries carry no lastmod.
  return (data ?? []).map((region) => ({
    loc: `${SITE_URL}/destinations/${region.key}`,
    changefreq: "weekly",
  }));
}

function buildXml(urls: UrlEntry[]): string {
  const escape = (s: string) => s.replace(/&/g, "&amp;");
  const entries = urls
    .map(
      (u) => `  <url>
    <loc>${escape(u.loc)}</loc>
${u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : ""}    <changefreq>${u.changefreq}</changefreq>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);

  const staticUrls: UrlEntry[] = [
    { loc: `${SITE_URL}/`, lastmod: today, changefreq: "daily" },
    { loc: `${SITE_URL}/guidebook`, lastmod: today, changefreq: "weekly" },
    { loc: `${SITE_URL}/ebook`, lastmod: today, changefreq: "weekly" },
    { loc: `${SITE_URL}/ask-a-local`, lastmod: today, changefreq: "weekly" },
    { loc: `${SITE_URL}/about`, lastmod: today, changefreq: "weekly" },
  ];

  const [blogUrls, spotUrls, regionUrls] = await Promise.all([
    fetchBlogPostUrls(),
    fetchSpotUrls(),
    fetchRegionUrls(),
  ]);

  const xml = buildXml([...staticUrls, ...blogUrls, ...spotUrls, ...regionUrls]);
  const outPath = path.resolve(__dirname, "../public/sitemap.xml");
  writeFileSync(outPath, xml, "utf-8");

  console.log(
    `Wrote ${outPath} — ${staticUrls.length} static + ${blogUrls.length} guides + ${spotUrls.length} spots + ${regionUrls.length} destinations.`,
  );
}

main().catch((err) => {
  console.error("Failed to generate sitemap:", err instanceof Error ? err.message : err);
  process.exit(1);
});
