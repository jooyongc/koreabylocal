import { Link } from "react-router-dom";
import type { SpotRow } from "@/hooks/useSpots";
import { SPOT_TYPES } from "@/data/spotTypes";

export default function SpotCard({ spot }: { spot: SpotRow }) {
  const image = spot.thumbnail_url ?? (Array.isArray(spot.images) ? (spot.images as string[])[0] : undefined);
  const typeInfo = SPOT_TYPES.find((t) => t.value === spot.spot_type);
  const place = spot.area ?? spot.location;

  return (
    <Link
      to={`/spots/${spot.slug}`}
      className="group flex flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_8px_26px_rgba(26,26,26,0.08)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(26,26,26,0.16)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-cream-200">
        {image && (
          <div
            role="img"
            aria-label={spot.title}
            className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${image})` }}
          />
        )}
        {typeInfo && (
          <span className="absolute left-[11px] top-[11px] rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
            {typeInfo.emoji} {typeInfo.label}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-[15px]">
        <h3 className="font-display text-[16px] font-bold leading-[1.25] text-ink">{spot.title}</h3>
        {spot.tagline && (
          <p className="mt-1.5 line-clamp-1 text-[13px] text-muted">{spot.tagline}</p>
        )}
        <div className="mt-auto flex items-center gap-1.5 pt-3 text-[12.5px] font-medium text-muted-2">
          {place && <span>📍 {place}</span>}
          {place && spot.price_range && <span>·</span>}
          {spot.price_range && <span>{spot.price_range}</span>}
        </div>
      </div>
    </Link>
  );
}
