import { Link } from "react-router-dom";
import { Star, Heart } from "lucide-react";

export interface Experience {
  title: string;
  loc: string;
  dur: string;
  price: string;
  old?: string;
  rating: string;
  reviews: string;
  badge?: "BEST" | "HOT" | "NEW" | "SALE";
  img: string;
  to?: string;
}

const BADGE_BG: Record<NonNullable<Experience["badge"]>, string> = {
  BEST: "#5b2bff",
  HOT: "#e8452a",
  NEW: "#0e8c6a",
  SALE: "#ff2d78",
};

/** Affiliate-partner experience card — shared by Home + Experiences list. */
export default function ExperienceCard({ x }: { x: Experience }) {
  return (
    <Link
      to={x.to ?? "/tours"}
      className="group flex flex-col overflow-hidden rounded-[18px] bg-white text-left shadow-[0_8px_26px_rgba(16,15,44,0.08)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_44px_rgba(16,15,44,0.16)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-cream-200">
        <div
          role="img"
          aria-label={x.title}
          className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url(${x.img})` }}
        />
        {x.badge && (
          <span
            className="absolute left-[11px] top-[11px] rounded-[7px] px-[9px] py-[5px] text-[10.5px] font-extrabold tracking-[0.06em] text-white"
            style={{ background: BADGE_BG[x.badge] }}
          >
            {x.badge}
          </span>
        )}
        <span className="absolute right-[11px] top-[11px] flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/90 text-ink">
          <Heart className="h-[15px] w-[15px]" />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-[15px] pb-[17px] pt-[15px]">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-2">
          📍 {x.loc} · {x.dur}
        </div>
        <h3 className="mt-[7px] font-display text-[17px] font-bold leading-[1.25] text-ink">
          {x.title}
        </h3>
        <div className="my-[9px] mb-3 flex items-center gap-1.5 text-[13px]">
          <Star className="h-[14px] w-[14px] fill-accent text-accent" />
          <span className="font-bold text-ink">{x.rating}</span>
          <span className="text-muted-2">({x.reviews})</span>
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-green">
            ✦ Instant
          </span>
        </div>
        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-[11px] text-muted-2">from</span>
          <span className="font-display text-[21px] font-extrabold text-ink">{x.price}</span>
          {x.old && <span className="text-[13px] text-muted-3 line-through">{x.old}</span>}
          <span className="text-[12px] text-muted-2">/ person</span>
        </div>
      </div>
    </Link>
  );
}
