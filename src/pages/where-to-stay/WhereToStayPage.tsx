import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Search } from "lucide-react";
import PageSEO from "@/components/common/PageSEO";
import AffiliateDisclosure from "@/components/stays/AffiliateDisclosure";
import StayCard from "@/components/stays/StayCard";
import { useStays } from "@/hooks/useStays";

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

  const all = useMemo(() => data ?? [], [data]);

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

  const programs = useMemo(() => all.map((s) => s.ota), [all]);

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
            Saw a hotel in our Reels? Find it below and tap <strong className="text-white">Check rate</strong> to see
            today’s price.
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
              <StayCard key={s.id} stay={s} highlight={s.slug === target} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-10 text-center text-muted">
            {all.length === 0 ? "Coming soon." : "No hotel matches that. Try another name or city."}
          </div>
        )}

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
