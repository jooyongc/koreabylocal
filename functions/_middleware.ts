import { type ArticleMeta, articleMeta, buildHead, injectHead, regionMeta, spotMeta } from "./_meta.ts";

// (1) 301 legacy Imweb blog URLs -> /guidebook/<slug> (SEO continuity after cutover)
// (2) /sitemap.xml proxied from the sitemap-generator edge function
// (3) real per-page metadata injected into the SPA shell for /guidebook/<slug>,
//     /spots/<slug> and /destinations/<key>
//
// The MAP below is generated (.design-handoff/db/gen-redirects.mjs); the rest
// of this file is hand-written.
const MAP: Record<string, string> = {
  "12587233": "korean-kimchi-and-where-to-buy",
  "13258456": "what-to-eat-poupular-snacksbunsik-in-korea",
  "14523690": "how-to-stay-connected-in-korea",
  "16666206": "5-things-you-can-do-like-a-local-in-korea",
  "16666237": "cash-free-bus-and-t-money-card",
  "16666338": "daily-expression",
  "17267093": "blackpink039s-top-5-beloved-restaurants",
  "18028547": "how-to-rental-and-book-wifi-in-korea-incheon-daegu-gimhae-gimpo-cheong",
  "18302403": "korea-travel-hotline",
  "19370811": "oliveyoung-shopping-tips-for-travelers",
  "26937507": "toechon-tomato-festival-in-gyeonggi-province",
  "27039389": "gunsan-brews-blues-festival",
  "40395707": "august-jangheung-water-festival",
  "69907834": "korean-polite-language-jon-dat-mal",
  "95441466": "festivals-in-september-suwon-and-seoul",
  "95443379": "korean-words-in-the-oxford-english-dictionary",
  "121943894": "han-kang-korean-author-and-2024-nobel-prize-winner-in-literature",
  "138432322": "korean-traditional-of-making-and-sharing-kimchi-gimjang-and-recipe",
  "139312481": "korea-in-chaos-jeju-flight-crash-in-muan-international-airport",
  "139858403": "k-protests-unveiled-understanding-south-koreas-movement",
  "141813872": "shop-like-a-local-in-korea-daiso",
  "152582233": "g-dragon-in-dongmyo-flea-market",
  "161536250": "the-water-delivery-service-for-long-term-residents-in-seoul",
  "161796050": "7-must-have-apps-for-living-traveling-in-korea",
  "163877418": "can-foreigners-visit-dmz-how-to-go",
  "164549957": "no-cash-on-buses-how-to-use-bus-in-korea-update-guide",
  "164551842": "how-to-book-intercity-buses-online-a-complete-guide-for-travelers",
  "167487058": "must-visit-places-in-gyeongju-city",
  "167540844": "where-to-stay-in-gyeongju-10-best-hotels-for-apec-2025-guests",
  "169576481": "bts-tour-news-june-concerts-confirmed-for-busan",
  "169577392": "how-to-book-ktx-trains-in-korea-the-ultimate-guide-to-the-korail-pass",
  "170089612": "how-do-i-get-to-goyang-stadium",
  "170239852": "2026-south-korea-public-holidays-a-complete-guide-for-travelers",
  "170257720": "how-to-go-jeonju-food-city-by-bus-and-train",
  "170268222": "discover-k-beauty-in-korea-download-olive-young-coupon",
  "170316576": "travel-jeju-through-the-drama-when-life-gives-you-tangerines",
  "170346017": "lost-wallet-in-seoul-subway-complete-guide",
  "170537696": "easy-bts-pilgrimage-2026-visit-every-iconic-spot-without-getting-lost",
  "170538106": "discover-seoul-pass-your-all-in-one-seoul-travel-essential",
  "170650363": "beyond-seoul-the-ultimate-cherry-blossom-road-trip-in-korea-2026",
  "170682610": "a-friendly-guide-to-isaac-toast-how-to-use-your-coupon",
  "171046164": "guide-to-the-ultimate-hangang-night-fireworks-cruise"
};

const SUPABASE_URL = "https://agkkvtfwqmzgbrqhvohs.supabase.co";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFna2t2dGZ3cW16Z2JycWh2b2hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MTU5MDIsImV4cCI6MjA4NjE5MTkwMn0.nZZ8Qrt0dU_v4CSeiVy4DM1IQLAEGBmKldtiotb6Oh8";

export const onRequest = async (context: { request: Request; next: () => Promise<Response> }) => {
  const url = new URL(context.request.url);

  // A request for a build file that doesn't exist falls through to the SPA
  // fallback and gets index.html with a 200 — and /assets/* is served
  // "immutable" for a year. During a deploy's rollout, edges briefly hand out
  // the new HTML before its new assets, so browsers cached the fallback HTML
  // as the app's entry script and the site never started for them. A missing
  // asset must be an uncached 404 instead, which the app's stale-chunk reload
  // recovers from.
  if (url.pathname.startsWith("/assets/")) {
    const res = await context.next();
    if ((res.headers.get("content-type") ?? "").includes("text/html")) {
      return new Response("Not found", {
        status: 404,
        headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" },
      });
    }
    return res;
  }

  // 301: legacy /blog/?bmode=view&idx=NNN -> /guidebook/<slug>
  if (url.searchParams.get("bmode") === "view") {
    const idx = url.searchParams.get("idx");
    const slug = idx ? MAP[idx] : undefined;
    if (slug) {
      // Straight to the canonical URL: going via /blog/<slug> only to be
      // redirected again cost every legacy link a second hop.
      return new Response(null, { status: 301, headers: { Location: `${url.origin}/guidebook/${slug}` } });
    }
  }

  // sitemap.xml -> proxy the edge function (kept same-origin for SEO)
  if (url.pathname === "/sitemap.xml") {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/sitemap-generator`, {
      headers: { Authorization: `Bearer ${ANON}`, apikey: ANON },
    });
    return new Response(await res.text(), {
      status: res.status,
      headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" },
    });
  }

  // /guidebook/<slug>, /spots/<slug>, /destinations/<key>: serve the shell
  // with the page's own head.
  const article = url.pathname.match(/^\/guidebook\/([^/]+)\/?$/);
  if (article) {
    return withHead(context, async () => {
      const post = await one(
        `blog_posts?select=title,slug,excerpt,content,seo_title,seo_description,thumbnail_url,hero_image_url,published_at,updated_at,author,category&status=eq.published&slug=eq.${encodeURIComponent(article[1])}`,
      );
      return post
        ? { meta: articleMeta(post, url.origin), article: post }
        : { meta: null, missing: true };
    });
  }

  const spot = url.pathname.match(/^\/spots\/([^/]+)\/?$/);
  if (spot) {
    return withHead(context, async () => {
      const row = await one(
        `experiences?select=title,slug,tagline,description,thumbnail_url,images,region,area,location,address,phone,latitude,longitude,hours&is_active=eq.true&slug=eq.${encodeURIComponent(spot[1])}`,
      );
      if (!row) return null;
      const region = row.region
        ? await one(`regions?select=name&key=ilike.${encodeURIComponent(row.region)}`)
        : null;
      return spotMeta(row, region?.name ?? null, url.origin);
    });
  }

  const destination = url.pathname.match(/^\/destinations\/([^/]+)\/?$/);
  if (destination) {
    return withHead(context, async () => {
      const region = await one(
        `regions?select=key,name,description,blurb,cover_image_url&key=eq.${encodeURIComponent(destination[1])}`,
      );
      return region ? regionMeta(region, url.origin) : null;
    });
  }

  return context.next();
};

/**
 * First row of a PostgREST query against the koreabylocal schema, or null.
 * Cached at the edge for a few minutes: an uncached lookup added ~0.3 s to
 * every article and spot page, and a post edited in the CMS only needs to show
 * its new title to crawlers within minutes, not instantly.
 */
const LOOKUP_TTL_SECONDS = 300;
// deno-lint-ignore no-explicit-any
async function one(query: string): Promise<any | null> {
  const url = `${SUPABASE_URL}/rest/v1/${query}&limit=1`;
  // deno-lint-ignore no-explicit-any
  const cache = (globalThis as any).caches?.default as Cache | undefined;
  let res = cache ? await cache.match(url) : undefined;
  if (!res) {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${ANON}`, apikey: ANON, "Accept-Profile": "koreabylocal" },
    });
    if (!res.ok) return null;
    if (cache) {
      const copy = new Response(res.clone().body, res);
      copy.headers.set("Cache-Control", `public, max-age=${LOOKUP_TTL_SECONDS}`);
      await cache.put(url, copy).catch(() => {});
    }
  }
  const [row] = await res.json();
  return row ?? null;
}

async function withHead(
  context: { next: () => Promise<Response> },
  lookup: () => Promise<ArticleMeta | null | { meta: ArticleMeta | null; article?: {title:string;content?:string|null}; missing?:boolean }>,
): Promise<Response> {
  const response = await context.next();
  const type = response.headers.get("content-type") ?? "";
  if (!response.ok || !type.includes("text/html")) return response;

  try {
    const found = await lookup();
    const meta = found && "meta" in found ? found.meta : found;
    if (found && "missing" in found && found.missing) {
      const headers = new Headers(response.headers);
      headers.delete("content-length");
      headers.set("Cache-Control", "no-store");
      return new Response(await response.text(), { status: 404, headers });
    }
    if (!meta) return response;

    let html = injectHead(await response.text(), buildHead(meta));
    const headers = new Headers(response.headers);
    headers.delete("content-length");
    const article = found && "article" in found ? found.article : undefined;
    if (!article) return new Response(html, { status: response.status, headers });
    const safeContent = await sanitizeArticle(article.content ?? "");
    const faq = Array.from(safeContent.matchAll(/<strong>Q:\s*([\s\S]*?)<\/strong>\s*<br\s*\/?>(?:\s*)A:\s*([\s\S]*?)(?=<\/p>)/gi), match => ({
      "@type": "Question", name: plain(match[1]),
      acceptedAnswer: { "@type": "Answer", text: plain(match[2]) },
    })).filter(row => row.name && row.acceptedAnswer.text);
    if (faq.length >= 3 && faq.length <= 5) {
      const faqJson = JSON.stringify({"@context":"https://schema.org","@type":"FAQPage",mainEntity:faq}).replace(/</g, "\\u003c");
      html = html.replace("</head>", `<script type="application/ld+json">${faqJson}</script></head>`);
    }
    const body = `<article class="crawler-article"><h1>${escapeHtml(article.title)}</h1>${safeContent}</article>`;
    return new HTMLRewriter()
      .on("#root", { element(element) { element.setInnerContent(body, { html: true }); } })
      .transform(new Response(html, { status: response.status, headers }));
  } catch {
    // A page with the generic head still works; a page that failed to load
    // does not. Never let the lookup break the response.
    return response;
  }
}

const unsafeTags = new Set(["script", "style", "iframe", "object", "embed", "svg", "form", "input", "button", "template"]);
const semanticTags = new Set(["p", "h2", "h3", "h4", "ul", "ol", "li", "a", "img", "strong", "em", "blockquote", "table", "thead", "tbody", "tr", "th", "td", "br", "hr", "figure", "figcaption", "code", "pre"]);
const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!));
const plain = (value: string) => value.replace(/<[^>]*>/g, " ").replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, entity => ({"&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&#39;":"'","&nbsp;":" "}[entity]!)).replace(/\s+/g, " ").trim();

/** Render real, published article text in the first HTML response for non-JS crawlers. */
async function sanitizeArticle(content: string): Promise<string> {
  const source = new Response(content.slice(0, 200000), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  return new HTMLRewriter().on("*", {
    element(element) {
      const tag = element.tagName.toLowerCase();
      if (unsafeTags.has(tag)) { element.remove(); return; }
      if (!semanticTags.has(tag)) { element.removeAndKeepContent(); return; }
      for (const [name, value] of Array.from(element.attributes)) {
        const key = name.toLowerCase();
        const isHref = tag === "a" && key === "href" && /^(https:\/\/|\/[^/]|#)/i.test(value);
        const isSrc = tag === "img" && key === "src" && /^https:\/\//i.test(value);
        const isAlt = tag === "img" && key === "alt";
        if (!isHref && !isSrc && !isAlt) element.removeAttribute(name);
      }
    },
  }).transform(source).text();
}
