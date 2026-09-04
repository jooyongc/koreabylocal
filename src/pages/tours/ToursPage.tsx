import { useMemo, useState } from "react";
import { Search, Star, SlidersHorizontal } from "lucide-react";
import PageSEO from "@/components/common/PageSEO";
import ExperienceCard, { experienceToCard } from "@/components/experiences/ExperienceCard";
import { useExperiences } from "@/hooks/useConcepts";
import { useReveal } from "@/hooks/useReveal";

const CATEGORIES = ["Day tours", "Food & drink", "Culture & history", "Nature & hiking"];
const REGION_PILLS = ["All Korea", "Seoul", "Busan", "Jeju", "Day trips", "Food"];
const SORTS = [
  { key: "pop", label: "Most popular" },
  { key: "rating", label: "Top rated" },
  { key: "price", label: "Price: low to high" },
  { key: "new", label: "Newest" },
];

export default function ToursPage() {
  const ref = useReveal<HTMLElement>();
  const { data } = useExperiences();
  const [sort, setSort] = useState("pop");
  const [cat, setCat] = useState<string | null>(null);

  const items = useMemo(() => {
    return (data ?? [])
      .filter((r) => (cat ? r.category === cat : true))
      .slice()
      .sort((a, b) => {
        if (sort === "price") return Number(a.price) - Number(b.price);
        if (sort === "rating") return Number(b.rating ?? 0) - Number(a.rating ?? 0);
        if (sort === "new") return (b.created_at ?? "").localeCompare(a.created_at ?? "");
        return b.reviews_count - a.reviews_count; // popular
      })
      .map(experienceToCard);
  }, [data, cat, sort]);

  return (
    <>
      <PageSEO
        title="Curated Tours & Experiences | Korea By Local"
        description="240+ hand-picked Korean experiences, each led by a verified local. Tours, food crawls, culture walks and day trips across Seoul, Busan and Jeju."
        path="/tours"
      />

      {/* Hero */}
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-[1180px] px-4 pb-[clamp(26px,4vw,44px)] pt-[clamp(28px,4vw,52px)] sm:px-6 lg:px-8">
          <div className="mb-3.5 text-[12.5px] text-white/55">
            Home / <span className="text-white">Tours &amp; experiences</span>
          </div>
          <h1 className="font-display text-[clamp(30px,5vw,56px)] font-extrabold leading-none tracking-[-0.02em]">
            Curated tours &amp; experiences
          </h1>
          <p className="mt-3.5 max-w-[54ch] text-[clamp(14px,1.5vw,17px)] text-white/70">
            Hand-picked experiences from trusted partners, every one led by a verified local.
            We may earn a commission — the price is the same for you.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {REGION_PILLS.map((p, i) => (
              <span
                key={p}
                className={`rounded-full px-[15px] py-2 text-[13px] font-semibold ${
                  i === 0 ? "bg-accent text-white" : "bg-white/10 text-white/85"
                }`}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Body */}
      <section
        ref={ref}
        className="reveal mx-auto flex max-w-[1180px] flex-wrap items-start gap-[clamp(20px,3vw,36px)] px-4 pb-[clamp(48px,7vw,90px)] pt-[clamp(24px,3vw,40px)] sm:px-6 lg:px-8"
      >
        {/* Filters */}
        <aside className="sticky top-[88px] min-w-[230px] max-w-[280px] flex-[1_1_240px] rounded-[20px] bg-white p-[22px] shadow-[0_8px_28px_rgba(26,26,26,0.07)]">
          <div className="mb-[18px] flex items-center justify-between">
            <span className="flex items-center gap-2 font-display text-[17px] font-bold">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </span>
            <button onClick={() => setCat(null)} className="text-[12.5px] font-semibold text-accent">
              Clear all
            </button>
          </div>
          <div className="mb-5 flex items-center gap-2 rounded-[11px] bg-paper px-[13px] py-[11px]">
            <Search className="h-4 w-4 text-muted-3" />
            <span className="text-[13.5px] text-muted-3">Search experiences</span>
          </div>
          <div className="mb-[11px] text-xs font-bold uppercase tracking-[0.08em] text-muted-3">Category</div>
          <div className="mb-[22px] flex flex-col gap-[11px]">
            {CATEGORIES.map((c) => {
              const on = cat === c;
              const count = (data ?? []).filter((r) => r.category === c).length;
              return (
                <button
                  key={c}
                  onClick={() => setCat(on ? null : c)}
                  className="flex items-center gap-2.5 text-left text-[14px] text-ink/80"
                >
                  <span
                    className={`flex h-[19px] w-[19px] items-center justify-center rounded-[6px] text-[12px] ${
                      on ? "bg-accent text-white" : "border-[1.5px] border-ink/20"
                    }`}
                  >
                    {on ? "✓" : ""}
                  </span>
                  {c}
                  <span className="ml-auto text-[12.5px] text-muted-3">{count ?? ""}</span>
                </button>
              );
            })}
          </div>
          <div className="mb-[11px] text-xs font-bold uppercase tracking-[0.08em] text-muted-3">Rating</div>
          <div className="flex gap-1.5">
            {["4.9+", "4.5+", "4+"].map((r, i) => (
              <span
                key={r}
                className={`flex items-center gap-1 rounded-full px-3 py-[7px] text-[13px] font-semibold ${
                  i === 0 ? "bg-ink text-white" : "border border-ink/12 text-muted"
                }`}
              >
                <Star className="h-3 w-3 fill-current" /> {r}
              </span>
            ))}
          </div>
        </aside>

        {/* Results */}
        <div className="min-w-[300px] flex-[3_1_420px]">
          <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
            <span className="text-[14.5px] text-muted">
              <strong className="font-display text-ink">{items.length}</strong> experiences ·{" "}
              <strong className="text-ink">Seoul to Jeju</strong>
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
          <div className="grid grid-cols-[repeat(auto-fit,minmax(270px,1fr))] gap-[18px]">
            {items.map((x) => (
              <ExperienceCard key={x.title} x={x} />
            ))}
          </div>
          {items.length === 0 && (
            <div className="rounded-2xl bg-white p-10 text-center text-muted">
              No experiences match these filters yet.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
