import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import OptimizedImage from "@/components/common/OptimizedImage";
import SpotMap from "@/components/spots/SpotMap";
import { MAPS_ENABLED } from "@/lib/maps";
import { useMapSpots } from "@/hooks/useMapSpots";

const PREVIEW_COUNT = 5;

/** Homepage: a quiet map plus the first few spots; "See all" opens Things to Do. */
export default function HomeSpotsPreview() {
  const { data, isLoading } = useMapSpots();
  const [activeId, setActiveId] = useState<number | null>(null);
  const spots = data ?? [];
  const preview = spots.slice(0, PREVIEW_COUNT);

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-2">Hosted by locals</div>
          <h2 className="mt-1 font-display text-[clamp(22px,3vw,30px)] font-extrabold tracking-[-0.02em] text-ink">
            Things to do with locals
          </h2>
        </div>
        <Link to="/things-to-do" className="flex shrink-0 items-center gap-1.5 text-[14px] font-semibold text-accent hover:underline">
          See all {spots.length > 0 ? spots.length : ""} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className={`grid gap-[clamp(14px,2vw,22px)] ${MAPS_ENABLED ? "lg:grid-cols-[1.25fr_1fr]" : ""}`}>
        {MAPS_ENABLED && (
          <SpotMap spots={spots} activeId={activeId} onSelect={setActiveId} simple className="h-[280px] lg:h-[380px]" />
        )}

        <ul className="flex flex-col divide-y divide-ink/[0.07] rounded-[20px] bg-white px-4 shadow-[0_8px_26px_rgba(26,26,26,0.06)]">
          {isLoading
            ? Array.from({ length: PREVIEW_COUNT }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 py-3">
                  <div className="h-14 w-14 shrink-0 animate-pulse rounded-xl bg-cream-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-3/4 animate-pulse rounded bg-cream-200" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-cream-200" />
                  </div>
                </li>
              ))
            : preview.map((s) => {
                const image = s.thumbnail_url ?? (Array.isArray(s.images) ? (s.images as string[])[0] : undefined);
                return (
                  <li key={s.id} onMouseEnter={() => setActiveId(s.id)}>
                    <Link to={`/spots/${s.slug}`} className="group flex items-center gap-3 py-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-cream-200">
                        {image && <OptimizedImage src={image} alt={s.title} preset="thumbnail" className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <div className="line-clamp-1 text-[14.5px] font-bold text-ink group-hover:text-accent">{s.title}</div>
                        <div className="mt-0.5 flex gap-2 text-[12.5px] text-muted-2">
                          {(s.area ?? s.location) && <span>{s.area ?? s.location}</span>}
                          {s.category && <span>{s.category}</span>}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
          {!isLoading && spots.length > PREVIEW_COUNT && (
            <li>
              <Link to="/things-to-do" className="block py-3 text-center text-[13.5px] font-semibold text-accent hover:underline">
                See all {spots.length} things to do
              </Link>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
