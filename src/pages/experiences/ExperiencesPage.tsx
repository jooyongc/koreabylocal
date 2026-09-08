import { useMemo, useState } from "react";
import { SlidersHorizontal, Check } from "lucide-react";
import PageSEO from "@/components/common/PageSEO";
import AffiliateExperienceCard from "@/components/experiences/AffiliateExperienceCard";
import { useAffiliateExperiences } from "@/hooks/useConcepts";

const SORTS = [
  { key: "pop", label: "Most popular" },
  { key: "rating", label: "Top rated" },
  { key: "price", label: "Price: low to high" },
];

export default function ExperiencesPage() {
  const { data, isLoading } = useAffiliateExperiences();
  const [region, setRegion] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState("pop");

  const all = useMemo(() => data ?? [], [data]);

  // Filter options come from the live data so we never show an empty region/category.
  const regions = useMemo(
    () => Array.from(new Set(all.map((r) => r.region).filter((v): v is string => !!v))).sort(),
    [all],
  );
  const categories = useMemo(
    () => Array.from(new Set(all.map((r) => r.category).filter((v): v is string => !!v))).sort(),
    [all],
  );

  const items = useMemo(() => {
    return all
      .filter((r) => (region ? r.region === region : true))
      .filter((r) => (category ? r.category === category : true))
      .slice()
      .sort((a, b) => {
        if (sort === "price") return Number(a.price) - Number(b.price);
        if (sort === "rating") return Number(b.rating ?? 0) - Number(a.rating ?? 0);
        return b.reviews_count - a.reviews_count;
      });
  }, [all, region, category, sort]);

  const countFor = (key: "region" | "category", value: string) => all.filter((r) => r[key] === value).length;

  return (
    <>
      <PageSEO
        title="Curated Experiences — Tours & Activities in Korea | Korea by Local"
        description="Hand-picked tours and activities from our trusted partners across Seoul, Busan, Jeju and beyond. We may earn a commission — the price is the same for you."
        path="/experiences"
      />

      {/* Hero */}
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-[1180px] px-4 pb-[clamp(26px,4vw,44px)] pt-[clamp(28px,4vw,52px)] sm:px-6 lg:px-8">
          <div className="mb-3.5 text-[12.5px] text-white/55">
            Home / <span className="text-white">Experiences</span>
          </div>
          <h1 className="font-display text-[clamp(30px,5vw,56px)] font-extrabold leading-none tracking-[-0.02em]">
            Curated Experiences
          </h1>
          <p className="mt-3.5 max-w-[54ch] text-[clamp(14px,1.5vw,17px)] text-white/70">
            Hand-picked tours &amp; activities from our partners. We may earn a commission when you book —
            the price is the same for you.
          </p>
          {regions.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => setRegion(null)}
                className={`rounded-full px-[15px] py-2 text-[13px] font-semibold transition-colors ${
                  region === null ? "bg-accent text-white" : "bg-white/10 text-white/85 hover:bg-white/20"
                }`}
              >
                All Korea
              </button>
              {regions.map((r) => (
                <button
                  key={r}
                  onClick={() => setRegion(region === r ? null : r)}
                  className={`rounded-full px-[15px] py-2 text-[13px] font-semibold transition-colors ${
                    region === r ? "bg-accent text-white" : "bg-white/10 text-white/85 hover:bg-white/20"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto flex max-w-[1180px] flex-wrap items-start gap-[clamp(20px,3vw,36px)] px-4 pb-[clamp(48px,7vw,90px)] pt-[clamp(24px,3vw,40px)] sm:px-6 lg:px-8">
        {/* Filters */}
        <aside className="min-w-[230px] max-w-[280px] flex-[1_1_240px] rounded-[20px] bg-white p-[22px] shadow-[0_8px_28px_rgba(26,26,26,0.07)] lg:sticky lg:top-[88px]">
          <div className="mb-[18px] flex items-center justify-between">
            <span className="flex items-center gap-2 font-display text-[17px] font-bold text-ink">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </span>
            <button
              onClick={() => {
                setRegion(null);
                setCategory(null);
              }}
              className="text-[12.5px] font-semibold text-accent"
            >
              Clear all
            </button>
          </div>

          <div className="mb-[11px] text-xs font-bold uppercase tracking-[0.08em] text-muted-3">Category</div>
          {categories.length === 0 ? (
            <p className="text-[13px] text-muted-3">No categories yet.</p>
          ) : (
            <div className="flex flex-col gap-[11px]">
              {categories.map((c) => {
                const on = category === c;
                return (
                  <button
                    key={c}
                    onClick={() => setCategory(on ? null : c)}
                    className="flex items-center gap-2.5 text-left text-[14px] text-ink/80"
                  >
                    <span
                      className={`flex h-[19px] w-[19px] items-center justify-center rounded-[6px] text-[12px] ${
                        on ? "bg-accent text-white" : "border-[1.5px] border-ink/20"
                      }`}
                    >
                      {on && <Check className="h-3 w-3" />}
                    </span>
                    {c}
                    <span className="ml-auto text-[12.5px] text-muted-3">{countFor("category", c)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* Results */}
        <div className="min-w-[300px] flex-[3_1_420px]">
          <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
            <span className="text-[14.5px] text-muted">
              <strong className="font-display text-ink">{items.length}</strong> experiences
              {region && (
                <>
                  {" "}
                  in <strong className="text-ink">{region}</strong>
                </>
              )}
            </span>
            <div className="flex gap-2 overflow-auto">
              {SORTS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSort(s.key)}
                  className={`whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-semibold ${
                    sort === s.key ? "bg-ink text-white" : "border border-ink/10 bg-white text-muted"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(270px,1fr))] gap-[18px]">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-[18px] bg-white shadow-[0_8px_26px_rgba(26,26,26,0.08)]">
                  <div className="aspect-[4/3] animate-pulse bg-cream-200" />
                  <div className="space-y-2 p-[15px]">
                    <div className="h-3 w-1/2 animate-pulse rounded bg-cream-200" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-cream-200" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-cream-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(270px,1fr))] gap-[18px]">
              {items.map((x) => (
                <AffiliateExperienceCard key={x.id} x={x} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-10 text-center text-muted">
              {all.length === 0
                ? "Partner experiences are coming soon."
                : "No experiences match these filters yet."}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
