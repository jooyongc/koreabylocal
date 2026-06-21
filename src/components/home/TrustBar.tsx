import { BadgeCheck, ArrowDownToLine, RotateCcw, Phone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useReveal } from "@/hooks/useReveal";

const TRUST: { icon: LucideIcon; title: string; desc: string; bg: string }[] = [
  { icon: BadgeCheck, title: "100% verified locals", desc: "Every host is ID-checked and rated by real travellers — no anonymous resellers.", bg: "rgba(14,140,106,0.1)" },
  { icon: ArrowDownToLine, title: "Best-price promise", desc: "Book direct and we’ll match any lower price you find for the same experience.", bg: "rgba(91,43,255,0.1)" },
  { icon: RotateCcw, title: "Free cancellation", desc: "Plans change. Cancel up to 24 hours before for a full, no-questions refund.", bg: "rgba(255,45,120,0.1)" },
  { icon: Phone, title: "24/7 real support", desc: "Reach a human in English or Korean any time, before and during your trip.", bg: "rgba(242,183,5,0.1)" },
];

export default function TrustBar() {
  const ref = useReveal<HTMLElement>();
  return (
    <section
      ref={ref}
      className="reveal mx-auto max-w-[1180px] px-4 pt-[clamp(44px,6vw,80px)] sm:px-6 lg:px-8"
    >
      <div className="rounded-[26px] bg-white p-[clamp(26px,4vw,48px)] shadow-[0_12px_40px_rgba(16,15,44,0.07)]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-[26px]">
          {TRUST.map(({ icon: Icon, title, desc, bg }) => (
            <div key={title}>
              <div
                className="flex h-[46px] w-[46px] items-center justify-center rounded-[13px]"
                style={{ background: bg }}
              >
                <Icon className="h-[21px] w-[21px] text-ink" strokeWidth={1.6} />
              </div>
              <div className="my-3.5 mb-1.5 font-display text-[17px] font-bold text-ink">{title}</div>
              <p className="text-[13.5px] leading-[1.5] text-muted">{desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-[30px] flex flex-wrap items-center gap-x-[22px] gap-y-3.5 border-t border-ink/8 pt-6">
          <span className="text-[12.5px] font-bold tracking-[0.04em] text-muted-2">Secure checkout</span>
          <span className="font-display text-[18px] font-extrabold italic text-[#003087]">
            Pay<span className="text-[#009cde]">Pal</span>
          </span>
          <span className="font-display text-[16px] font-extrabold tracking-[-0.04em] text-[#1a1f71]">VISA</span>
          <span className="text-[16px] font-extrabold text-[#eb001b]">●●</span>
          <span className="text-[12.5px] text-muted-2">SSL encrypted · PCI-DSS compliant</span>
        </div>
      </div>
    </section>
  );
}
