import { Star } from "lucide-react";
import type { Tables } from "@/types/database";

export const AFFILIATE_EXPERIENCE_COLUMNS =
  "id, slug, title, location, region, category, duration, price, currency, compare_price, rating, reviews_count, thumbnail_url, images, affiliate_network, affiliate_url";

export type AffiliateExperienceRow = Pick<
  Tables<"experiences">,
  | "id"
  | "slug"
  | "title"
  | "location"
  | "region"
  | "category"
  | "duration"
  | "price"
  | "currency"
  | "compare_price"
  | "rating"
  | "reviews_count"
  | "thumbnail_url"
  | "images"
  | "affiliate_network"
  | "affiliate_url"
>;

function money(n: number | null, currency: string | null): string | undefined {
  if (n == null) return undefined;
  const symbol = currency === "KRW" ? "₩" : currency === "JPY" ? "¥" : "$";
  return `${symbol}${Number(n) % 1 === 0 ? n : Number(n).toFixed(2)}`;
}

/** Affiliate-partner experience card — always links out to the partner's booking page. */
export default function AffiliateExperienceCard({ x }: { x: AffiliateExperienceRow }) {
  const image = x.thumbnail_url ?? (Array.isArray(x.images) ? (x.images as string[])[0] : undefined);
  const price = money(x.price, x.currency);
  const comparePrice = money(x.compare_price, x.currency);

  return (
    <a
      href={x.affiliate_url ?? undefined}
      target="_blank"
      rel="noopener sponsored"
      className="group relative flex flex-col overflow-hidden rounded-[18px] bg-white text-left shadow-[0_8px_26px_rgba(26,26,26,0.08)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_44px_rgba(26,26,26,0.16)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-cream-200">
        {image && (
          <img
            src={image}
            alt={x.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col p-[15px] pb-[17px] pt-[15px]">
        {(x.location || x.duration) && (
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-2">
            📍 {x.location}
            {x.location && x.duration ? " · " : ""}
            {x.duration}
          </div>
        )}
        <h3 className="mt-[7px] line-clamp-2 font-display text-[17px] font-bold leading-[1.25] text-ink">
          {x.title}
        </h3>
        <div className="my-[9px] mb-3 flex items-center gap-1.5 text-[13px]">
          <Star className="h-[14px] w-[14px] fill-accent text-accent" />
          <span className="font-bold text-ink">{x.rating != null ? x.rating : "—"}</span>
          <span className="text-muted-2">({x.reviews_count.toLocaleString()})</span>
        </div>
        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] text-muted-2">from</span>
            <span className="font-display text-[21px] font-extrabold text-ink">{price ?? "—"}</span>
            {comparePrice && <span className="text-[13px] text-muted-3 line-through">{comparePrice}</span>}
          </div>
          {x.affiliate_network && (
            <span className="shrink-0 rounded-[7px] bg-ink/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              {x.affiliate_network}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
