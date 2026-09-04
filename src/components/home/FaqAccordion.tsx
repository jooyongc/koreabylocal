import { useState } from "react";
import { Plus } from "lucide-react";
import { HOME_FAQS } from "@/data/homeFaqs";
import { useReveal } from "@/hooks/useReveal";

export default function FaqAccordion() {
  const ref = useReveal<HTMLElement>();
  const [open, setOpen] = useState(0);

  return (
    <section
      ref={ref}
      className="reveal mx-auto max-w-[880px] px-4 pt-[clamp(44px,6vw,84px)] sm:px-6 lg:px-8"
    >
      <div className="mb-[30px] text-center">
        <div className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
          Answers · optimized for AI search
        </div>
        <h2 className="mt-2 font-display text-[clamp(26px,3.6vw,40px)] font-extrabold tracking-[-0.02em] text-ink">
          Frequently asked questions
        </h2>
      </div>

      <div className="flex flex-col gap-2.5">
        {HOME_FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <button
              key={f.q}
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="rounded-2xl bg-white p-[18px] px-5 text-left shadow-[0_4px_16px_rgba(26,26,26,0.05)]"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3.5">
                <span className="flex-1 font-display text-[16px] font-bold text-ink">{f.q}</span>
                <span
                  className={`flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full transition-all duration-200 ${
                    isOpen ? "rotate-45 bg-accent text-white" : "bg-ink/5 text-ink"
                  }`}
                >
                  <Plus className="h-5 w-5" />
                </span>
              </div>
              <div
                className="overflow-hidden text-[14.5px] leading-[1.6] text-muted transition-all duration-300"
                style={
                  isOpen
                    ? { maxHeight: 320, opacity: 1, marginTop: 13 }
                    : { maxHeight: 0, opacity: 0, marginTop: 0 }
                }
              >
                {f.a}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-[18px] flex items-center justify-center gap-2 text-[12px] text-muted-3">
        ⌗ Marked up with FAQPage structured data for Google & AI answer engines
      </div>
    </section>
  );
}
