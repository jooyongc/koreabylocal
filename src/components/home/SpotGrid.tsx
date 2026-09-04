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
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="flex items-center gap-2 rounded-full border border-ink/15 bg-white px-7 py-3 text-[14px] font-bold text-ink transition-colors hover:border-ink/30 disabled:opacity-50"
              >
                {isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin" />}
                Load More
              </button>
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
