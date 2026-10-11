import { Link } from "react-router-dom";
import { MapPin, PlayCircle, Star } from "lucide-react";
import OptimizedImage from "@/components/common/OptimizedImage";
import type { RegionRow } from "@/hooks/useConcepts";
import { trackEvent } from "@/hooks/useSiteAnalytics";
import { rememberPreferredOta, visibleOffers } from "@/lib/stayOffers";
import type { StayOffer, StayOta, StayRow } from "@/types/stays";

/**
 * One hotel from an @koreastaylist Reel. The Reel tells viewers to "choose
 * <label>", so the label is the most prominent text on the card.
 *
 * The whole card is NOT a link on purpose: affiliate links sit on the booking
 * buttons only (rel="nofollow sponsored"), and the Reel link is a separate,
 * ordinary link. Every OTA we have a link for gets the same button, so the
 * visitor picks the site they already use; their usual one goes first and is
 * marked. `region`, when the city has a destination page, adds an internal
 * link to it.
 */
export default function StayCard({
  stay,
  region,
  preferredOta = null,
  highlight = false,
}: {
  stay: StayRow;
  region?: Pick<RegionRow, "key" | "name">;
  preferredOta?: StayOta | null;
  highlight?: boolean;
}) {
  const place = [stay.city, stay.area].filter(Boolean).join(" · ");
  const highlights = (stay.highlights ?? []).slice(0, 3);

  const offers = visibleOffers(stay);
  const buttons = [...offers.filter((o) => o.ota === preferredOta), ...offers.filter((o) => o.ota !== preferredOta)];
  // 3 fit side by side on a phone-width card; 4 wrap to 2×2 so "Hotels.com" still fits.
  const cols = buttons.length === 3 ? "grid-cols-3" : buttons.length === 1 ? "grid-cols-1" : "grid-cols-2";

  const onBook = (o: StayOffer, position: number) => {
    rememberPreferredOta(o.ota);
    trackEvent("affiliate_click", { ota: o.ota, stay: stay.slug, position, page: "/where-to-stay" });
  };

  return (
    <article
      id={stay.slug}
      className={`flex scroll-mt-[96px] flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_8px_26px_rgba(26,26,26,0.08)] transition-shadow ${
        highlight ? "ring-2 ring-accent ring-offset-2 ring-offset-paper" : ""
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-cream-200">
        {stay.thumb_url && (
          <OptimizedImage src={stay.thumb_url} alt={stay.name} preset="card" className="h-full w-full object-cover" />
        )}
        {place && (
          <span className="absolute left-[11px] top-[11px] rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em] text-white backdrop-blur-sm">
            {place}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-[15px]">
        <h2 className="font-display text-[18px] font-extrabold leading-[1.2] text-ink">{stay.label}</h2>
        {stay.name !== stay.label && <p className="mt-0.5 line-clamp-1 text-[12.5px] text-muted-2">{stay.name}</p>}

        {stay.rating != null && (
          <p className="mt-2 flex items-center gap-1.5 text-[13.5px] text-muted">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
            <strong className="font-display text-ink">{Number(stay.rating).toFixed(1)}</strong>/10
            {stay.review_count != null && <span>· {stay.review_count.toLocaleString("en-US")} reviews on {stay.ota}</span>}
          </p>
        )}

        {highlights.length > 0 && (
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {highlights.map((h) => (
              <li key={h} className="rounded-full bg-cream-200 px-2.5 py-1 text-[12px] font-semibold text-ink/80">
                {h}
              </li>
            ))}
          </ul>
        )}

        {region && (
          <Link
            to={`/destinations/${region.key}`}
            className="mt-3 inline-flex items-center gap-1 self-start text-[12.5px] font-semibold text-muted hover:text-accent"
          >
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            Explore {region.name}
          </Link>
        )}

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12px] font-semibold text-muted">Check rates on</p>
            {stay.reel_url && (
              <a
                href={stay.reel_url}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-muted hover:text-ink"
              >
                <PlayCircle className="h-4 w-4" aria-hidden />
                Reel
              </a>
            )}
          </div>

          {buttons.length > 0 && (
            <div className={`mt-2 grid gap-2 ${cols}`}>
              {buttons.map((o, i) => {
                const usual = o.ota === preferredOta;
                return (
                  <a
                    key={o.ota}
                    href={o.url}
                    target="_blank"
                    rel="nofollow sponsored noopener"
                    data-stay={stay.slug}
                    data-ota={o.ota}
                    aria-label={`Check rate on ${o.ota}${usual ? " (your usual site)" : ""}`}
                    onClick={() => onBook(o, i + 1)}
                    className={`flex min-h-[44px] flex-col items-center justify-center rounded-[12px] border-[1.5px] px-1.5 py-2 text-center transition-colors hover:border-accent hover:bg-accent hover:text-white ${
                      usual ? "border-accent bg-accent/[0.06] text-accent" : "border-ink/15 bg-white text-ink"
                    }`}
                  >
                    <span className="whitespace-nowrap text-[13px] font-bold leading-tight">{o.ota}</span>
                    {usual && <span className="mt-0.5 text-[9.5px] font-bold uppercase tracking-[0.04em]">Your usual</span>}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
