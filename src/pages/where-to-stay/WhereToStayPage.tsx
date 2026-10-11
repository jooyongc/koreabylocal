import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, BookOpen, Compass, MessageCircle, Search } from "lucide-react";
import PageSEO from "@/components/common/PageSEO";
import AffiliateDisclosure from "@/components/stays/AffiliateDisclosure";
import StayCard from "@/components/stays/StayCard";
import { useRegionGuides, useRegions, type RegionRow } from "@/hooks/useConcepts";
import { useStays } from "@/hooks/useStays";
import { readPreferredOta, visibleOffers } from "@/lib/stayOffers";

// The rest of the site, for visitors who came for a hotel and are still planning.
const MORE_PLANNING = [
  {
    to: "/guidebook",
    icon: BookOpen,
    title: "Travel Blog",
    text: "City guides, food and itineraries from people who live here.",
    cta: "Read the guides",
  },
  {
    to: "/things-to-do",
    icon: Compass,
    title: "Things to Do",
    text: "Food walks, cooking classes and hikes hosted by locals.",
    cta: "See what's on",
  },
  {
    to: "/ask-a-local",
    icon: MessageCircle,
    title: "Ask a Local",
    text: "Stuck on a plan? Get a personal answer from someone who lives here.",
    cta: "Ask a question",
  },
];

/**
 * /where-to-stay — the page behind the @koreastaylist profile link.
 *
 * Every Reel ends with "tap the link in our profile and choose <label>", so a
 * visitor arrives here looking for one hotel name. Search and city chips get
 * them there in one tap; /where-to-stay#<slug> scrolls straight to a card.
 */
export default function WhereToStayPage() {
  const { data, isLoading } = useStays();
  const { hash } = useLocation();
  const [city, setCity] = useState<string | null>(null);
  const [q, setQ] = useState("");
  // Read once per visit, so chips don't reshuffle while the visitor is clicking.
  const [preferredOta] = useState(readPreferredOta);

  const all = useMemo(() => data ?? [], [data]);

  // A stay's city ("Busan") -> its destination page, when there is one.
  const { data: regions } = useRegions();
  const regionByCity = useMemo(() => {
    const m = new Map<string, RegionRow>();
    for (const r of regions ?? []) {
      m.set(r.key.toLowerCase(), r);
      m.set(r.name.toLowerCase(), r);
    }
    return m;
  }, [regions]);
  const cityRegion = city ? regionByCity.get(city.toLowerCase()) : undefined;
  const { data: cityGuides } = useRegionGuides(cityRegion?.name);

  // Cities come from the live data so a chip never leads to an empty list.
  const cities = useMemo(() => {
    const order = ["Seoul", "Busan", "Jeju"]; // the usual first stops, then A–Z
    const set = Array.from(new Set(all.map((s) => s.city)));
    return set.sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      return a.localeCompare(b);
    });
  }, [all]);

  const stays = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all
      .filter((s) => (city ? s.city === city : true))
      .filter((s) =>
        needle ? [s.label, s.name, s.city, s.area ?? ""].join(" ").toLowerCase().includes(needle) : true,
      );
  }, [all, city, q]);

  const target = hash ? decodeURIComponent(hash.slice(1)) : null;
  useEffect(() => {
    if (!target || isLoading) return;
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [target, isLoading]);

  // Disclose every OTA that has a booking button on screen, not just the main one.
  const programs = useMemo(() => stays.flatMap((s) => visibleOffers(s).map((o) => o.ota)), [stays]);

  const jsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Where to Stay in Korea — hotels from our Reels",
      itemListElement: all.map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://koreabylocal.com/where-to-stay#${s.slug}`,
        item: {
          "@type": "Hotel",
          name: s.name,
          address: { "@type": "PostalAddress", addressLocality: s.city, addressCountry: "KR" },
          ...(s.thumb_url ? { image: s.thumb_url } : {}),
        },
        // No aggregateRating: the scores are the OTA's, not reviews collected here.
      })),
    }),
    [all],
  );

  const chip = (on: boolean) =>
    `shrink-0 whitespace-nowrap rounded-full px-[15px] py-2 text-[13px] font-semibold transition-colors ${
      on ? "bg-accent text-white" : "bg-white/10 text-white/85 hover:bg-white/20"
    }`;

  return (
    <>
      <PageSEO
        title="Where to Stay in Korea — Hotels from Our Reels | Korea by Local"
        description="Hotels in Seoul, Busan, Jeju and beyond that we featured in our Reels, with guest ratings and what guests love. Tap a hotel to check today's rate."
        path="/where-to-stay"
        // Only once the list is in: Helmet adds the filled script but leaves the
        // empty one from the first render behind (other pages mount PageSEO after loading).
        jsonLd={all.length > 0 ? jsonLd : undefined}
      />

      {/* Hero */}
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-[1180px] px-4 pb-[clamp(26px,4vw,44px)] pt-[clamp(28px,4vw,52px)] sm:px-6 lg:px-8">
          <div className="mb-3.5 text-[12.5px] text-white/55">
            Home / <span className="text-white">Where to Stay</span>
          </div>
          <h1 className="font-display text-[clamp(30px,5vw,56px)] font-extrabold leading-none tracking-[-0.02em]">
            Where to Stay in Korea
          </h1>
          <p className="mt-3.5 max-w-[56ch] text-[clamp(14px,1.5vw,17px)] text-white/70">
            Saw a hotel in our Reels? Find it below and book on the site you already use.
          </p>

          <label className="relative mt-5 block max-w-[520px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search a hotel or city"
              aria-label="Search a hotel or city"
              className="w-full rounded-full border border-white/15 bg-white/10 py-2.5 pl-10 pr-4 text-[14.5px] text-white placeholder:text-white/45 focus:border-accent focus:outline-none"
            />
          </label>

          {cities.length > 1 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button onClick={() => setCity(null)} className={chip(city === null)}>
                All Korea
              </button>
              {cities.map((c) => (
                <button key={c} onClick={() => setCity(city === c ? null : c)} className={chip(city === c)}>
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 pb-[clamp(48px,7vw,90px)] pt-[clamp(20px,3vw,32px)] sm:px-6 lg:px-8">
        <div className="mb-5">
          <AffiliateDisclosure programs={programs} />
        </div>

        <p className="mb-4 text-[14.5px] text-muted">
          <strong className="font-display text-ink">{stays.length}</strong> {stays.length === 1 ? "hotel" : "hotels"}
          {city ? ` in ${city}` : ""}
        </p>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-[18px] bg-white shadow-[0_8px_26px_rgba(26,26,26,0.08)]">
                <div className="aspect-[4/3] animate-pulse bg-cream-200" />
                <div className="space-y-2 p-[15px]">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-cream-200" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-cream-200" />
                </div>
              </div>
            ))}
          </div>
        ) : stays.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stays.map((s) => (
              <StayCard
                key={s.id}
                stay={s}
                region={regionByCity.get(s.city.toLowerCase())}
                preferredOta={preferredOta}
                highlight={s.slug === target}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-10 text-center text-muted">
            {all.length === 0 ? "Coming soon." : "No hotel matches that. Try another name or city."}
          </div>
        )}

        {cityRegion && (
          <div className="mt-6 rounded-2xl border border-ink/10 bg-white p-[18px]">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 className="font-display text-[17px] font-extrabold text-ink">Planning {cityRegion.name}?</h2>
              <Link
                to={`/destinations/${cityRegion.key}`}
                className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-accent hover:underline"
              >
                All of {cityRegion.name}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
            {cityGuides && cityGuides.length > 0 && (
              <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {cityGuides.slice(0, 3).map((post) => (
                  <li key={post.id}>
                    <Link
                      to={`/guidebook/${post.slug}`}
                      className="flex items-start gap-2 text-[13.5px] font-semibold leading-[1.45] text-ink hover:text-accent"
                    >
                      <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                      <span className="line-clamp-2">{post.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <section className="mt-[clamp(36px,5vw,56px)]">
          <h2 className="font-display text-[clamp(20px,2.4vw,26px)] font-extrabold tracking-[-0.01em] text-ink">
            Planning the rest of your trip?
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {MORE_PLANNING.map(({ to, icon: Icon, title, text, cta }) => (
              <Link
                key={to}
                to={to}
                className="group flex flex-col rounded-2xl border border-ink/10 bg-white p-5 transition-colors hover:border-accent"
              >
                <Icon className="h-5 w-5 text-accent" aria-hidden />
                <span className="mt-3 font-display text-[16px] font-extrabold text-ink">{title}</span>
                <span className="mt-1 text-[13.5px] leading-[1.55] text-muted">{text}</span>
                <span className="mt-auto inline-flex items-center gap-1 pt-3 text-[13px] font-semibold text-accent">
                  {cta}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <p className="mt-10 text-center text-[12.5px] leading-[1.7] text-muted-2">
          Ratings and review counts are the booking site’s figures on the date we checked them. Prices and availability
          change — the booking page always has the latest.
          <br />
          Follow{" "}
          <a href="https://www.instagram.com/koreastaylist/" target="_blank" rel="noopener" className="font-semibold underline">
            @koreastaylist
          </a>{" "}
          for new hotel picks.
        </p>
      </section>
    </>
  );
}
