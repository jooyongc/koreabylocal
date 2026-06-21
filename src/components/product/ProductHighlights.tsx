import { ShieldCheck, Truck, Sparkles, BadgeCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Highlight {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

const HIGHLIGHTS: Highlight[] = [
  {
    icon: BadgeCheck,
    title: "Local-curated",
    subtitle: "Picked by people who actually live here",
  },
  {
    icon: Sparkles,
    title: "Authentic quality",
    subtitle: "Genuine goods, no tourist mark-ups",
  },
  {
    icon: Truck,
    title: "Worldwide shipping",
    subtitle: "Carefully packed and tracked to your door",
  },
  {
    icon: ShieldCheck,
    title: "Buyer protection",
    subtitle: "Secure checkout and easy support",
  },
];

/**
 * Presentational row of reassurance highlight cards.
 * Static brand messaging only — no product logic.
 */
export default function ProductHighlights() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {HIGHLIGHTS.map(({ icon: Icon, title, subtitle }) => (
        <div
          key={title}
          className="rounded-2xl bg-white p-4 shadow-[0_5px_18px_rgba(16,15,44,0.05)]"
        >
          <Icon className="h-5 w-5 text-accent" strokeWidth={2} aria-hidden="true" />
          <div className="mt-2 font-display text-[15px] font-bold text-ink">
            {title}
          </div>
          <div className="mt-0.5 text-[12.5px] leading-snug text-muted-2">
            {subtitle}
          </div>
        </div>
      ))}
    </div>
  );
}
