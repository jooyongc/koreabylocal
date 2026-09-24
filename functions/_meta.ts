// Puts an article's own title, description, canonical, social tags and
// structured data into the HTML before it leaves the edge.
//
// The site is a client-rendered SPA: index.html is the same 3.9KB shell for
// every URL, and react-helmet fills the head only after React runs. Google
// executes JavaScript, but it does so on a second pass through a render queue,
// so the first thing it sees for all 52 articles is one shared title and
// description, no canonical and no structured data. For a site whose traffic
// is meant to come from search, that is the single most expensive thing about
// the current setup.
//
// Rewriting the head here fixes it without moving the app to SSR: the crawler
// gets the real metadata in the first response, and the browser gets the same
// page it always did — react-helmet simply overwrites tags that already say
// the right thing.

const ESCAPES: Record<string, string> = {
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
};
const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ESCAPES[c]);

/** Plain text from article HTML, for a description when none was written. */
const strip = (html: string) =>
  html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

export interface ArticleMeta {
  title: string;
  description: string;
  canonical: string;
  image?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  author?: string | null;
  section?: string | null;
  /** Article pages get Article markup; everything else stays a plain page. */
  kind: "article" | "page";
}

export function buildHead(meta: ArticleMeta, siteName = "Korea by Local"): string {
  const parts: string[] = [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}"/>`,
    `<link rel="canonical" href="${esc(meta.canonical)}"/>`,
    `<meta property="og:type" content="${meta.kind === "article" ? "article" : "website"}"/>`,
    `<meta property="og:title" content="${esc(meta.title)}"/>`,
    `<meta property="og:description" content="${esc(meta.description)}"/>`,
    `<meta property="og:url" content="${esc(meta.canonical)}"/>`,
    `<meta property="og:site_name" content="${esc(siteName)}"/>`,
    `<meta name="twitter:card" content="summary_large_image"/>`,
    `<meta name="twitter:title" content="${esc(meta.title)}"/>`,
    `<meta name="twitter:description" content="${esc(meta.description)}"/>`,
  ];
  if (meta.image) {
    parts.push(`<meta property="og:image" content="${esc(meta.image)}"/>`);
    parts.push(`<meta name="twitter:image" content="${esc(meta.image)}"/>`);
  }

  if (meta.kind === "article") {
    const ld: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: meta.title,
      description: meta.description,
      mainEntityOfPage: meta.canonical,
      publisher: { "@type": "Organization", name: siteName },
    };
    if (meta.image) ld.image = [meta.image];
    if (meta.publishedAt) ld.datePublished = meta.publishedAt;
    if (meta.updatedAt) ld.dateModified = meta.updatedAt;
    if (meta.author) ld.author = { "@type": "Person", name: meta.author };
    if (meta.section) ld.articleSection = meta.section;
    // </script> inside the JSON would close this tag early.
    parts.push(
      `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`,
    );
  }

  return parts.join("");
}

/**
 * Replaces the shell's title and description rather than appending to them —
 * two titles in one document is worse than the generic one it started with.
 */
export function injectHead(html: string, head: string): string {
  const cleaned = html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name=["']description["'][^>]*>/gi, "")
    .replace(/<meta\s+property=["']og:[^"']*["'][^>]*>/gi, "")
    .replace(/<meta\s+name=["']twitter:[^"']*["'][^>]*>/gi, "");

  return cleaned.includes("</head>")
    ? cleaned.replace("</head>", `${head}</head>`)
    : `${head}${cleaned}`;
}

export function articleMeta(
  post: {
    title: string; slug: string; excerpt?: string | null; content?: string | null;
    seo_title?: string | null; seo_description?: string | null;
    thumbnail_url?: string | null; published_at?: string | null;
    updated_at?: string | null; author?: string | null; category?: string | null;
  },
  origin: string,
): ArticleMeta {
  const description =
    post.seo_description?.trim() ||
    post.excerpt?.trim() ||
    strip(post.content ?? "").slice(0, 155);

  return {
    title: `${post.seo_title?.trim() || post.title} | Korea by Local`,
    description,
    canonical: `${origin}/guidebook/${post.slug}`,
    image: post.thumbnail_url ?? null,
    publishedAt: post.published_at ?? null,
    updatedAt: post.updated_at ?? null,
    author: post.author ?? "Korea by Local",
    section: post.category ?? null,
    kind: "article",
  };
}
