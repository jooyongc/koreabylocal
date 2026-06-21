import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRegions } from "@/hooks/useConcepts";

interface Region {
  key: string;
  name: string;
  count: number;
  hosts: number;
  rating: string;
  tag: string;
  blurb: string;
  top: string;
  left: string;
}

export default function RegionMap() {
  const navigate = useNavigate();
  const [active, setActive] = useState<string | null>(null);
  const { data } = useRegions();

  if (!data || data.length === 0) return null;

  const regions: Region[] = data.map((r) => ({
    key: r.key,
    name: r.name,
    count: r.experiences_count,
    hosts: r.hosts_count,
    rating: r.rating != null ? String(r.rating) : "—",
    tag: r.tag ?? "",
    blurb: r.blurb ?? "",
    top: r.map_top ?? "50%",
    left: r.map_left ?? "50%",
  }));
  const cur = regions.find((r) => r.key === active) ?? regions[0];

  return (
    <section className="mt-[clamp(52px,7vw,96px)] bg-ink text-white">
      <div className="mx-auto grid max-w-[1180px] grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-center gap-[clamp(24px,4vw,52px)] px-4 py-[clamp(44px,6vw,76px)] sm:px-6 lg:px-8">
        {/* Left: copy + active region card */}
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
            Explore by region · GEO
          </div>
          <h2 className="mt-2.5 font-display text-[clamp(28px,4vw,46px)] font-extrabold leading-[1.02] tracking-[-0.02em]">
            Where do you want
            <br />
            to wander?
          </h2>
          <p className="my-4 max-w-[42ch] text-[15px] leading-[1.55] text-white/70">
            Tap a region to see how many local experiences are waiting. Every pin
            is a verified host on the ground.
          </p>
          <div className="rounded-[18px] border border-white/12 bg-white/5 p-[22px]">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
              {cur.tag}
            </div>
            <div className="mb-0.5 mt-1.5 font-display text-[30px] font-extrabold">{cur.name}</div>
            <p className="my-2 mb-4 text-[14px] leading-[1.5] text-white/70">{cur.blurb}</p>
            <div className="flex flex-wrap gap-x-[22px] gap-y-2">
              <Metric value={cur.count} label="experiences" />
              <Metric value={cur.hosts} label="local hosts" />
              <Metric value={cur.rating} label="avg rating" />
            </div>
            <button
              onClick={() => navigate("/tours")}
              className="mt-[18px] w-full rounded-xl bg-accent py-3 text-[14px] font-bold text-white transition-transform hover:scale-[1.02]"
            >
              Explore {cur.name} →
            </button>
          </div>
        </div>

        {/* Right: interactive map */}
        <div className="relative aspect-[1/1.05] overflow-hidden rounded-[24px] border border-white/10 bg-[#0b0a22]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)",
              backgroundSize: "34px 34px",
            }}
          />
          <svg viewBox="0 0 300 320" className="absolute inset-0 h-full w-full opacity-50">
            <path
              d="M150 28 C188 36 196 70 184 96 C176 114 192 128 196 150 C200 176 178 188 182 214 C186 240 160 252 150 286 C140 252 116 246 112 220 C108 196 92 188 100 162 C108 138 96 118 110 96 C122 76 112 40 150 28 Z"
              fill="rgba(91,43,255,.10)"
              stroke="rgba(255,45,120,.35)"
              strokeWidth="1.5"
            />
          </svg>
          {regions.map((r) => {
            const on = r.key === cur.key;
            return (
              <button
                key={r.key}
                onClick={() => setActive(r.key)}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5"
                style={{ top: r.top, left: r.left, zIndex: on ? 5 : 2 }}
                aria-label={`${r.name}, ${r.count} experiences`}
              >
                <span
                  className={`rounded-full transition-all ${on ? "animate-pulse-dot h-4 w-4" : "h-3 w-3"}`}
                  style={{
                    background: on ? "#ff2d78" : "rgba(255,255,255,.55)",
                    boxShadow: on ? "0 0 0 6px rgba(255,45,120,.25)" : "0 0 0 3px rgba(255,255,255,.12)",
                  }}
                />
                <span
                  className="whitespace-nowrap rounded-full border px-2 py-[3px] font-display text-[11px] font-bold"
                  style={{
                    color: on ? "#100f2c" : "rgba(255,255,255,.8)",
                    background: on ? "#ff2d78" : "rgba(255,255,255,.08)",
                    borderColor: on ? "transparent" : "rgba(255,255,255,.14)",
                  }}
                >
                  {r.name} · {r.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <div className="font-display text-[24px] font-extrabold text-accent">{value}</div>
      <div className="text-[11.5px] tracking-[0.04em] text-white/60">{label}</div>
    </div>
  );
}
