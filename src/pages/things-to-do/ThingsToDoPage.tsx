import { useMemo, useState } from "react";
import PageSEO from "@/components/common/PageSEO";
import SpotCard from "@/components/home/SpotCard";
import SpotMap, { MAPS_ENABLED } from "@/components/spots/SpotMap";
import { useMapSpots } from "@/hooks/useMapSpots";

/**
 * Every spot from /admin/spots, as a list and as pins on a map. Hovering a card
 * lights up its pin; clicking a pin opens a mini card that links to the spot.
 */
export default function ThingsToDoPage() {
  const { data, isLoading } = useMapSpots();
  const [region, setRegion] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);

  const all = useMemo(() => data ?? [], [data]);

  // Filter options come from the live data so we never show an empty region/category.
  const regions = useMemo(
    () => Array.from(new Set(all.map((s) => s.region).filter((v): v is string => !!v))).sort(),
    [all],
  );
  const categories = useMemo(
    () => Array.from(new Set(all.map((s) => s.category).filter((v): v is string => !!v))).sort(),
    [all],
  );

  const spots = useMemo(
    () =>
      all
        .filter((s) => (region ? s.region === region : true))
        .filter((s) => (category ? s.category === category : true)),
    [all, region, category],
  );

  const chip = (on: boolean) =>
    `shrink-0 whitespace-nowrap rounded-full px-[15px] py-2 text-[13px] font-semibold transition-colors ${
      on ? "bg-accent text-white" : "bg-white/10 text-white/85 hover:bg-white/20"
    }`;
  const subChip = (on: boolean) =>
    `shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors ${
      on ? "bg-ink text-white" : "border border-ink/10 bg-white text-muted hover:border-ink/30"
    }`;

  return (
    <>
      <PageSEO
        title="Things to Do in Korea with Locals — Map & List | Korea by Local"
        description="Cooking classes, food walks and hikes hosted by locals across Seoul and Busan — see them on a map and pick what fits your trip."
        path="/things-to-do"
      />

      {/* Hero */}
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-[1180px] px-4 pb-[clamp(26px,4vw,44px)] pt-[clamp(28px,4vw,52px)] sm:px-6 lg:px-8">
          <div className="mb-3.5 text-[12.5px] text-white/55">
            Home / <span className="text-white">Things to Do</span>
          </div>
          <h1 className="font-display text-[clamp(30px,5vw,56px)] font-extrabold leading-none tracking-[-0.02em]">
            Things to Do with Locals
          </h1>
          <p className="mt-3.5 max-w-[54ch] text-[clamp(14px,1.5vw,17px)] text-white/70">
            Cooking classes, market walks and morning hikes, hosted by people who live here. Find the one that fits your trip.
          </p>
          {regions.length > 1 && (
            <div className="mt-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button onClick={() => setRegion(null)} className={chip(region === null)}>
                All Korea
              </button>
              {regions.map((r) => (
                <button key={r} onClick={() => setRegion(region === r ? null : r)} className={chip(region === r)}>
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 pb-[clamp(48px,7vw,90px)] pt-[clamp(20px,3vw,32px)] sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[14.5px] text-muted">
            <strong className="font-display text-ink">{spots.length}</strong> things to do
          </span>
          {categories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button onClick={() => setCategory(null)} className={subChip(category === null)}>
                All
              </button>
              {categories.map((c) => (
                <button key={c} onClick={() => setCategory(category === c ? null : c)} className={subChip(category === c)}>
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-[clamp(18px,2.5vw,28px)] lg:flex-row-reverse lg:items-start">
          {/* Map — on top on mobile, sticky on the right on desktop */}
          {MAPS_ENABLED && (
            <div className="lg:sticky lg:top-[88px] lg:w-[44%] lg:shrink-0">
              <SpotMap
                spots={spots}
                activeId={activeId}
                onSelect={setActiveId}
                className="h-[300px] shadow-[0_8px_28px_rgba(26,26,26,0.08)] lg:h-[calc(100vh-120px)]"
              />
            </div>
          )}

          {/* List */}
          <div className="min-w-0 flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            ) : spots.length > 0 ? (
              <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${MAPS_ENABLED ? "" : "lg:grid-cols-3"}`}>
                {spots.map((s) => (
                  <div
                    key={s.id}
                    onMouseEnter={() => setActiveId(s.id)}
                    className={`rounded-[18px] transition-shadow ${activeId === s.id ? "ring-2 ring-accent ring-offset-2 ring-offset-paper" : ""}`}
                  >
                    <SpotCard spot={s} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white p-10 text-center text-muted">
                {all.length === 0 ? "Coming soon." : "Nothing matches these filters yet."}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
