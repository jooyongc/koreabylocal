import { Link } from "react-router-dom";
import SectionHeading from "./SectionHeading";
import { useHosts } from "@/hooks/useConcepts";
import { useReveal } from "@/hooks/useReveal";

export default function LocalHosts() {
  const ref = useReveal<HTMLElement>();
  const { data, isLoading } = useHosts(8);

  if (!isLoading && (!data || data.length === 0)) return null;

  return (
    <section
      ref={ref}
      className="reveal mx-auto max-w-[1180px] px-4 pt-[clamp(44px,6vw,80px)] sm:px-6 lg:px-8"
    >
      <SectionHeading
        eyebrow="The people, not the brochure"
        title="Meet your local hosts"
        link={{ label: "Browse experiences", to: "/tours" }}
      />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        {(data ?? []).map((h) => (
          <Link
            key={h.id}
            to="/tours"
            className="relative aspect-[3/4] overflow-hidden rounded-[20px] bg-ink shadow-[0_10px_30px_rgba(26,26,26,0.12)]"
          >
            <div
              role="img"
              aria-label={h.name}
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${h.avatar_url ?? ""})` }}
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg,rgba(26,26,26,0) 35%,rgba(26,26,26,.88) 100%)" }}
            />
            {h.verified && (
              <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-paper/95 px-2.5 py-[5px] text-[11px] font-bold text-ink">
                ✦ Verified
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              <div className="font-display text-[19px] font-bold">{h.name}</div>
              <div className="mt-[3px] flex items-center gap-2 text-[12.5px] text-white/85">
                📍 {h.city} · ★ {h.rating}
              </div>
              <div className="mt-[9px] flex gap-1.5">
                {(h.languages ?? []).map((l) => (
                  <span
                    key={l}
                    className="rounded-md bg-white/15 px-[7px] py-[3px] text-[10.5px] font-bold tracking-[0.04em]"
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
