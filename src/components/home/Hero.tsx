import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useEditorPickSpot } from "@/hooks/useConcepts";

const AREAS = "JEONJU · BUSAN · GYEONGJU · GANGNEUNG & MORE";

export default function Hero() {
  const { data: pick, isLoading } = useEditorPickSpot();
  const image = pick?.thumbnail_url ?? (Array.isArray(pick?.images) ? (pick.images as string[])[0] : undefined);

  return (
    <section className="bg-paper">
      <div className="mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-[clamp(32px,5vw,56px)] px-4 py-[clamp(40px,7vw,88px)] sm:px-6 lg:grid-cols-[3fr_2fr] lg:px-8">
        {/* Left: brand message */}
        <div>
          <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-accent">
            <span className="h-[7px] w-[7px] rounded-full bg-accent" />
            {AREAS}
          </div>

          <h1 className="mt-4 font-display text-[clamp(42px,7vw,84px)] font-extrabold leading-[0.98] tracking-[-0.03em] text-ink">
            KOREA,
            <br />
            every city
            <br />
            <span className="font-serif-accent font-medium italic text-accent">actually</span>
            <br />
            worth it.
          </h1>

          <p className="mt-6 max-w-[46ch] text-[clamp(15px,1.6vw,18px)] leading-[1.6] text-muted">
            From hidden alleys to local favorites — we help you travel deeper, city by city.
          </p>
        </div>

        {/* Right: Editor's Pick */}
        {isLoading ? (
          <div className="flex aspect-[4/5] items-center justify-center rounded-[24px] bg-cream-200 lg:aspect-auto lg:h-full lg:min-h-[380px]">
            <Loader2 className="h-6 w-6 animate-spin text-muted-3" />
          </div>
        ) : pick ? (
          <Link
            to={`/spots/${pick.slug}`}
            className="group relative flex min-h-[340px] flex-col justify-end overflow-hidden rounded-[24px] p-[clamp(22px,3vw,32px)] text-white shadow-[0_24px_54px_rgba(232,75,42,0.28)] transition-transform duration-300 hover:-translate-y-1"
            style={{ background: "linear-gradient(160deg,#e84b2a,#b8331a)" }}
          >
            {image && (
              <img
                src={image}
                alt={pick.title}
                className="absolute inset-0 h-full w-full object-cover opacity-40 transition-transform duration-500 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

            <span className="relative mb-auto inline-flex w-fit items-center gap-1.5 rounded-full border border-white/40 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.1em]">
              ★ Editor's Pick
            </span>

            <div className="relative">
              {pick.spot_type && (
                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/75">
                  {pick.spot_type}
                </span>
              )}
              <h2 className="mt-1 font-display text-[26px] font-extrabold leading-[1.1]">{pick.title}</h2>
              {pick.tagline && (
                <p className="mt-1.5 font-serif-accent text-[15px] italic text-white/85">{pick.tagline}</p>
              )}
            </div>
          </Link>
        ) : (
          <Link
            to="#spot-gallery"
            className="flex min-h-[340px] flex-col items-start justify-end rounded-[24px] p-[clamp(22px,3vw,32px)] text-white shadow-[0_24px_54px_rgba(232,75,42,0.28)] transition-transform duration-300 hover:-translate-y-1"
            style={{ background: "linear-gradient(160deg,#e84b2a,#b8331a)" }}
          >
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/40 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.1em]">
              ★ Editor's Pick
            </span>
            <h2 className="mt-4 font-display text-[24px] font-extrabold leading-[1.15]">
              New spots are being curated
            </h2>
            <p className="mt-1.5 text-[14px] text-white/85">Browse everything we've found so far →</p>
          </Link>
        )}
      </div>
    </section>
  );
}
