import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import {
  Plane,
  ArrowLeftRight,
  Car,
  Sparkles,
  PlaneTakeoff,
  ShieldCheck,
  Languages,
} from "lucide-react";
import PageSEO from "@/components/common/PageSEO";
import SectionHeading from "@/components/home/SectionHeading";
import { useReveal } from "@/hooks/useReveal";
import RouteCard, {
  type TransferRoute,
} from "@/components/transfers/RouteCard";
import TripGenieBanner from "@/components/home/TripGenieBanner";

/** A coloured "transfer type" card surface. */
interface TransferType {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  /** Tailwind classes for the card's brand background + matching shadow. */
  surface: string;
  label: string;
  desc: string;
  price: string;
  tag: string;
}

const TRANSFER_TYPES: TransferType[] = [
  {
    icon: Plane,
    surface: "bg-purple shadow-[0_14px_34px_rgba(91,43,255,0.2)]",
    label: "Airport pickup & drop-off",
    desc: "Incheon (ICN) & Gimpo (GMP) to your hotel. Meet-and-greet, flight tracking, flat fare.",
    price: "from $48",
    tag: "Most booked",
  },
  {
    icon: ArrowLeftRight,
    surface: "bg-green shadow-[0_14px_34px_rgba(14,140,106,0.2)]",
    label: "City-to-city connections",
    desc: "Seoul to Busan, Jeonju, Gangneung & more. Private door-to-door, no train changes.",
    price: "from $190",
    tag: "Long distance",
  },
  {
    icon: Car,
    surface: "bg-coral shadow-[0_14px_34px_rgba(232,69,42,0.2)]",
    label: "Chauffeur-included rental",
    desc: "A private car and an English-speaking driver for a half or full day, your itinerary.",
    price: "from $260 / day",
    tag: "Flexible",
  },
];

const POPULAR_ROUTES: TransferRoute[] = [
  {
    route: "Incheon Airport → Seoul city",
    type: "Private sedan · up to 3 pax",
    time: "~70 min",
    price: "$48",
    img: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=700&q=80",
  },
  {
    route: "Incheon Airport → Seoul (group van)",
    type: "Private van · up to 7 pax",
    time: "~70 min",
    price: "$72",
    img: "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=700&q=80",
  },
  {
    route: "Seoul → Busan",
    type: "Intercity · sedan + driver",
    time: "~4.5 h",
    price: "$320",
    img: "https://images.unsplash.com/photo-1546874177-9e664107314e?w=700&q=80",
  },
  {
    route: "Full-day chauffeur · Seoul",
    type: "8 h · car + English driver",
    time: "Your itinerary",
    price: "$260",
    img: "https://images.unsplash.com/photo-1502161254066-6c74afbf07aa?w=700&q=80",
  },
];

const TRUST_POINTS: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
}[] = [
  { icon: PlaneTakeoff, label: "Flight tracking included" },
  { icon: Sparkles, label: "Meet & greet at arrivals" },
  { icon: ShieldCheck, label: "Free cancellation 24h" },
  { icon: Languages, label: "English-speaking drivers" },
];

export default function TransfersPage() {
  const typesReveal = useReveal();
  const routesReveal = useReveal();

  return (
    <>
      <PageSEO
        title="Private Transfers Across Korea | Korea By Local"
        description="Airport runs, intercity hops and full-day chauffeur service across Korea — fixed prices, English-speaking drivers, and your flight tracked door to door."
        path="/getting-there"
      />

      {/* Hero — dark ink */}
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-[1180px] px-[clamp(16px,3vw,32px)] py-[clamp(30px,4.5vw,60px)]">
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
            Get there easy · 교통
          </div>
          <h1 className="mt-2.5 max-w-[16ch] font-display text-[clamp(30px,5.5vw,60px)] font-extrabold leading-none tracking-[-0.02em]">
            Private transfers across Korea
          </h1>
          <p className="mt-4 max-w-[52ch] text-[clamp(14px,1.6vw,18px)] text-white/70">
            Airport runs, intercity hops and full-day chauffeur — fixed prices,
            English-speaking drivers, and your flight tracked door to door.
            Operated by Korea by Local.
          </p>
        </div>
      </section>

      {/* Transfer types — coloured cards */}
      <section
        aria-label="Transfer types"
        className="mx-auto max-w-[1180px] px-[clamp(16px,3vw,32px)] pt-[clamp(28px,4vw,48px)]"
      >
        <div
          ref={typesReveal}
          className="reveal grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4"
        >
          {TRANSFER_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <Link
                key={type.label}
                to="/tours"
                aria-label={`${type.label} — ${type.price}. ${type.desc}`}
                className={`flex flex-col rounded-[20px] p-[26px] text-left text-white transition-transform duration-300 hover:-translate-y-1.5 ${type.surface}`}
              >
                <div className="flex items-center justify-between">
                  <Icon className="h-[30px] w-[30px]" aria-hidden={true} />
                  <span className="rounded-full bg-white/[0.18] px-2.5 py-[5px] text-[11px] font-bold">
                    {type.tag}
                  </span>
                </div>
                <div className="mt-[18px] mb-2 font-display text-[20px] font-bold">
                  {type.label}
                </div>
                <p className="mb-3.5 text-[13.5px] leading-relaxed text-white/85">
                  {type.desc}
                </p>
                <div className="mt-auto font-display text-[17px] font-extrabold">
                  {type.price}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Popular routes */}
      <section className="mx-auto max-w-[1180px] px-[clamp(16px,3vw,32px)] pt-[clamp(34px,5vw,64px)] pb-[clamp(48px,7vw,90px)]">
        <SectionHeading
          eyebrow="Door to door · 인기 노선"
          title="Popular routes"
          link={{ label: "Plan a custom trip", to: "/ask-a-local" }}
        />

        <div
          ref={routesReveal}
          className="reveal grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4"
        >
          {POPULAR_ROUTES.map((route) => (
            <RouteCard key={route.route} route={route} to="/tours" />
          ))}
        </div>

        {/* Trust row */}
        <ul className="mt-[30px] flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-[13px] text-muted">
          {TRUST_POINTS.map((point) => {
            const Icon = point.icon;
            return (
              <li key={point.label} className="inline-flex items-center gap-2">
                <Icon className="h-4 w-4 text-accent" aria-hidden={true} />
                {point.label}
              </li>
            );
          })}
        </ul>
      </section>

      <TripGenieBanner
        title="Not sure which transfer you need?"
        subtitle="Tell a real local your itinerary and get a straight answer."
      />
    </>
  );
}
