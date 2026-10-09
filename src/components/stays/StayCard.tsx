import { ArrowUpRight, PlayCircle, Star } from "lucide-react";
import OptimizedImage from "@/components/common/OptimizedImage";
import type { StayRow } from "@/types/stays";

/**
 * One hotel from an @koreastaylist Reel. The Reel tells viewers to "choose
 * <label>", so the label is the most prominent text on the card.
 *
 * The whole card is NOT a link on purpose: the affiliate link sits on the
 * "Check rate" button only (rel="nofollow sponsored"), and the Reel link is a
 * separate, ordinary link.
 */
export default function StayCard({ stay, highlight = false }: { stay: StayRow; highlight?: boolean }) {
  const place = [stay.city, stay.area].filter(Boolean).join(" · ");
  const highlights = (stay.highlights ?? []).slice(0, 3);

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

        <div className="mt-auto flex items-center gap-3 pt-4">
          <a
            href={stay.affiliate_url}
            target="_blank"
            rel="nofollow sponsored noopener"
            data-stay={stay.slug}
            data-ota={stay.ota}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-accent px-4 py-2.5 text-[14px] font-bold text-white transition-opacity hover:opacity-90"
          >
            Check rate on {stay.ota}
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </a>
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
      </div>
    </article>
  );
}
