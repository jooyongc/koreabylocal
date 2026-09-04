import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useSpots } from "@/hooks/useSpots";
import { useSpotFilters } from "@/hooks/useSpotFilters";
import SpotCard from "./SpotCard";

interface SpotGridProps {
  /** Fixes the area filter (e.g. a destination landing page) instead of reading it from the URL. */
  area?: string;
}

export default function SpotGrid({ area: areaOverride }: SpotGridProps = {}) {
  const { area: areaFromParams, type } = useSpotFilters();
  const area = areaOverride ?? areaFromParams;
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useSpots({ area, type });

  const spots = data?.pages.flatMap((p) => p.rows) ?? [];
  const hasFilter = !!area || !!type;

  // Auto-load the next page as the sentinel nears the viewport, instead of a "Load More" click.
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div id="spot-gallery" className="mx-auto max-w-[1180px] scroll-mt-24 px-4 pb-[clamp(28px,4vw,44px)] pt-[clamp(20px,3vw,32px)] sm:px-6 lg:px-8">
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SpotCardSkeleton key={i} />
          ))}
        </div>
      ) : spots.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {spots.map((spot) => (
              <SpotCard key={spot.id} spot={spot} />
            ))}
          </div>
          {hasNextPage && (
            <div ref={sentinelRef} className="mt-8 flex justify-center">
              {isFetchingNextPage && <Loader2 className="h-5 w-5 animate-spin text-accent" />}
            </div>
          )}
        </>
      ) : (
        <div className="py-20 text-center text-muted">
          {hasFilter ? (
            <p>No spots found for this filter. Try another combination!</p>
          ) : (
            <p>Coming soon — we're curating the best spots.</p>
          )}
        </div>
      )}
    </div>
  );
}

function SpotCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[18px] bg-white shadow-[0_8px_26px_rgba(26,26,26,0.08)]">
      <div className="aspect-[4/3] animate-pulse bg-cream-200" />
      <div className="space-y-2 p-[15px]">
        <div className="h-4 w-3/4 animate-pulse rounded bg-cream-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-cream-200" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-cream-200" />
      </div>
    </div>
  );
}
