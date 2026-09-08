import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useEditorPickSpot } from "@/hooks/useConcepts";

const AREAS = ["SEOUL", "BUSAN", "JEJU", "GANGNEUNG & MORE"];

export default function Hero() {
  const { data: pick, isLoading } = useEditorPickSpot();
  const image = pick?.thumbnail_url ?? (Array.isArray(pick?.images) ? (pick.images as string[])[0] : undefined);

  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-[1180px] px-4 py-[clamp(24px,4vw,40px)] sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 overflow-hidden rounded-[20px] border-[1.5px] border-ink lg:grid-cols-[3fr_2fr] lg:divide-x-[1.5px] lg:divide-ink">
          {/* Left: brand message */}
          <div className="border-b-[1.5px] border-ink p-[clamp(28px,4vw,48px)] lg:border-b-0">
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[12px] font-bold uppercase tracking-[0.14em] text-accent">
              <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-accent" />
              {AREAS.map((area) => (
                <span key={area}>{area}</span>
              ))}
            </div>

            <h1 className="mt-4 font-display text-[clamp(38px,6vw,72px)] font-extrabold leading-[0.98] tracking-[-0.03em] text-ink">
              KOREA,
              <br />
              every city
              <br />
              <span className="text-accent">actually</span>
              <br />
              worth it.
            </h1>

            <p className="mt-6 max-w-[46ch] text-[clamp(15px,1.6vw,18px)] leading-[1.6] text-muted">
              From hidden alleys to local favorites — we help you travel deeper, city by city.
            </p>
          </div>

          {/* Right: Editor's Pick */}
          {isLoading ? (
            <div className="flex min-h-[280px] items-center justify-center bg-accent-light lg:min-h-full">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : pick ? (
            <Link
              to={`/spots/${pick.slug}`}
              className="group relative flex min-h-[280px] flex-col justify-end overflow-hidden bg-accent p-[clamp(24px,3vw,36px)] text-white lg:min-h-full"
            >
              {image && (
                <img
                  src={image}
                  alt={pick.title}
                  className="absolute inset-0 h-full w-full object-cover opacity-45 transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />

              <span className="relative mb-auto inline-flex w-fit items-center gap-1.5 rounded-full border border-white/50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.1em]">
                Editor's Pick
              </span>

              <div className="relative">
                {pick.spot_type && (
                  <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/75">
                    {pick.spot_type}
                  </span>
                )}
                <h2 className="mt-1 font-display text-[24px] font-extrabold leading-[1.1]">{pick.title}</h2>
                {pick.tagline && <p className="mt-1.5 text-[14px] text-white/85">{pick.tagline}</p>}
              </div>
            </Link>
          ) : (
            <Link
              to="#spot-gallery"
              className="flex min-h-[280px] flex-col items-start justify-end bg-accent p-[clamp(24px,3vw,36px)] text-white lg:min-h-full"
            >
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.1em]">
                Editor's Pick
              </span>
              <h2 className="mt-4 font-display text-[22px] font-extrabold leading-[1.15]">Coming soon</h2>
              <p className="mt-1.5 text-[14px] text-white/85">New spots are being curated.</p>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
