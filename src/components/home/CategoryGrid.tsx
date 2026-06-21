import { Link } from "react-router-dom";
import { BookOpen, Ticket, Plane, ShoppingBag, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import SectionHeading from "./SectionHeading";
import { useReveal } from "@/hooks/useReveal";

// 오방색 — five entry points into the platform. TODO(db): counts from live data.
const CATEGORIES: {
  icon: LucideIcon;
  label: string;
  desc: string;
  count: string;
  color: string;
  to: string;
}[] = [
  { icon: BookOpen, label: "Read the Magazine", desc: "Local stories & city guides", count: "1,284", color: "#100f2c", to: "/blog" },
  { icon: Ticket, label: "Experiences", desc: "Tours & activities · affiliate", count: "240+", color: "#0e8c6a", to: "/tours" },
  { icon: Plane, label: "Transfers", desc: "Airport, intercity & chauffeur", count: "60+", color: "#5b2bff", to: "/transfers" },
  { icon: ShoppingBag, label: "Shop", desc: "Prints & goods · affiliate", count: "300+", color: "#ff2d78", to: "/shop" },
  { icon: Sparkles, label: "Ask a Local", desc: "Free 1:1 trip advice", count: "Free", color: "#f2b705", to: "/ask-a-local" },
];

export default function CategoryGrid() {
  const ref = useReveal<HTMLElement>();
  return (
    <section
      ref={ref}
      className="reveal mx-auto max-w-[1180px] px-4 pt-[clamp(40px,6vw,72px)] sm:px-6 lg:px-8"
    >
      <SectionHeading eyebrow="오방색 · Five ways in" title="Everything you need, one local platform" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
        {CATEGORIES.map(({ icon: Icon, label, desc, count, color, to }) => (
          <Link
            key={label}
            to={to}
            className="flex min-h-[158px] flex-col justify-between gap-6 rounded-[18px] p-[18px] text-white transition-transform duration-300 hover:-translate-y-1.5"
            style={{ background: color, boxShadow: `0 10px 26px ${color}33` }}
          >
            <div className="flex items-center justify-between">
              <Icon className="h-7 w-7" strokeWidth={1.6} />
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">
                {count}
              </span>
            </div>
            <div>
              <div className="font-display text-[18px] font-bold">{label}</div>
              <div className="mt-[3px] text-[12.5px] leading-snug opacity-85">{desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
