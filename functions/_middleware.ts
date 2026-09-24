import { articleMeta, buildHead, injectHead } from "./_meta.ts";

// (1) 301 legacy Imweb blog URLs -> /guidebook/<slug> (SEO continuity after cutover)
// (2) /sitemap.xml proxied from the sitemap-generator edge function
// (3) real per-article metadata injected into the SPA shell for /guidebook/<slug>
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

  // /guidebook/<slug>: serve the shell with this article's real head.
  const article = url.pathname.match(/^\/guidebook\/([^/]+)\/?$/);
  if (article) {
    const response = await context.next();
    const type = response.headers.get("content-type") ?? "";
    if (!response.ok || !type.includes("text/html")) return response;

    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/blog_posts?select=title,slug,excerpt,content,seo_title,seo_description,thumbnail_url,published_at,updated_at,author,category&status=eq.published&slug=eq.${encodeURIComponent(article[1])}&limit=1`,
        { headers: { Authorization: `Bearer ${ANON}`, apikey: ANON, "Accept-Profile": "koreabylocal" } },
      );
      if (!res.ok) return response;
      const [post] = await res.json();
      if (!post) return response;

      const html = injectHead(await response.text(), buildHead(articleMeta(post, url.origin)));
      const headers = new Headers(response.headers);
      headers.delete("content-length");
      return new Response(html, { status: response.status, headers });
    } catch {
      // A page with the generic head still works; a page that failed to load
      // does not. Never let the lookup break the response.
      return response;
    }
  }

  return context.next();
};
