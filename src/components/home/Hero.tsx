import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useSiteStats } from "@/hooks/useConcepts";

const POPULAR = ["Seoul", "Busan", "Jeju", "Food", "Hanbok"];
const MARQUEE = [
  "DMZ day tour", "Hanbok & palaces", "Busan coast", "Jeju sunrise",
  "Night market food", "Private transfers",
];

export default function Hero() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const { data: stats } = useSiteStats();

  const search = (term?: string) => {
    const query = (term ?? q).trim();
    navigate(query ? `/guidebook?q=${encodeURIComponent(query)}` : "/guidebook");
  };

  return (
    <section className="relative overflow-hidden bg-ink text-white">
      <img
        src="https://images.unsplash.com/photo-1538485399081-7191377e8241?w=2000&q=80"
        alt="Seoul at dusk"
        className="absolute inset-0 h-full w-full object-cover opacity-55"
        loading="eager"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg,rgba(16,15,44,.55) 0%,rgba(16,15,44,.35) 35%,rgba(16,15,44,.9) 100%)",
        }}
      />
      <div className="relative mx-auto max-w-[1180px] px-4 pb-[clamp(24px,4vw,44px)] pt-[clamp(48px,8vw,104px)] sm:px-6 lg:px-8">
        <div className="inline-flex items-center gap-2.5 rounded-full border border-white/30 px-3.5 py-[7px] text-xs font-semibold uppercase tracking-[0.16em] backdrop-blur-sm">
          <span className="h-[7px] w-[7px] rounded-full bg-accent shadow-[0_0_0_4px_rgba(255,45,120,0.25)]" />
          The Korea magazine · stories by locals
        </div>

        <h1 className="mt-[22px] max-w-[14ch] font-display text-[clamp(40px,8vw,86px)] font-extrabold leading-[0.98] tracking-[-0.03em]">
          See Korea the way <span className="accent-underline">locals</span>{" "}
          <span className="font-serif-accent font-medium italic">live it.</span>
        </h1>
        <p className="mt-5 max-w-[48ch] text-[clamp(15px,1.6vw,19px)] leading-[1.5] text-white/80">
          A magazine of honest local guides — where to eat, when to go, what to
          skip. Search a city or a craving, and start reading.
        </p>

        {/* content search */}
        <form
          onSubmit={(e) => { e.preventDefault(); search(); }}
          className="mt-[30px] flex max-w-[680px] flex-wrap items-center gap-2 rounded-[18px] bg-paper/95 py-2 pl-[18px] pr-2 shadow-[0_26px_60px_rgba(16,15,44,0.4)]"
        >
          <Search className="h-[19px] w-[19px] text-muted-2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search stories — “Seoul food”, “Jeju in autumn”, “hanbok”…"
            className="min-w-0 flex-1 bg-transparent py-2 text-[clamp(15px,1.7vw,18px)] text-ink outline-none placeholder:text-muted-2"
          />
          <button
            type="submit"
            className="rounded-[13px] bg-accent px-[26px] py-3.5 text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(255,45,120,0.4)] transition-transform hover:scale-[1.03]"
          >
            Search
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[12.5px] text-white/60">Popular:</span>
          {POPULAR.map((p) => (
            <button
              key={p}
              onClick={() => search(p)}
              className="rounded-full border border-white/20 bg-white/10 px-3.5 py-[7px] text-[13px] font-semibold text-white transition-colors hover:bg-white/20"
            >
              {p}
            </button>
          ))}
        </div>

        <div className="mt-[26px] flex flex-wrap gap-x-[30px] gap-y-[22px]">
          <Stat value={stats ? stats.posts.toLocaleString() : "—"} label="local stories" />
          <Stat value={stats ? stats.experiences.toLocaleString() : "—"} label="experiences" />
          {stats && stats.hosts > 0 && (
            <div className="flex items-center gap-2 text-[13px] text-white/80">
              ✦ Written by {stats.hosts} verified locals
            </div>
          )}
        </div>
      </div>

      {/* marquee */}
      <div className="relative overflow-hidden border-t border-white/10 bg-ink/55">
        <div className="flex w-max animate-marquee items-center py-[11px] font-display text-[13px] font-semibold uppercase tracking-[0.1em] text-white/55">
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i} className="flex items-center">
              <span className="px-[26px]">{m}</span>
              <span className="text-accent">/</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="font-display text-[22px] font-extrabold">{value}</span>
      <span className="text-[13px] text-white/70">{label}</span>
    </div>
  );
}
