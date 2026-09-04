import { useState } from "react";
import { Plus } from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: "How does shipping work?",
    a: "Every order is carefully packed and shipped with tracking. Delivery times vary by destination — you'll receive a tracking link as soon as your order is on its way.",
  },
  {
    q: "What is your return policy?",
    a: "If something isn't right, reach out within 14 days of delivery and our team will help you with a return or exchange.",
  },
  {
    q: "Are these products authentic?",
    a: "Yes. Everything in our shop is locally sourced and verified by people who live in Korea — no tourist mark-ups, no knock-offs.",
  },
  {
    q: "How can I get help with my order?",
    a: "Our support team is happy to help before and after purchase. Use the share or contact options and we'll get back to you quickly.",
  },
];

/**
 * Presentational "Good to know" accordion.
 * Static brand FAQ — no product or commerce logic.
 */
export default function GoodToKnow() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-2.5">
      {FAQS.map((faq, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={faq.q}
            className="overflow-hidden rounded-2xl bg-white shadow-[0_3px_12px_rgba(26,26,26,0.04)]"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-3.5 px-4 py-4 text-left"
            >
              <span className="flex-1 font-display text-[15px] font-bold text-ink">
                {faq.q}
              </span>
              <Plus
                className={`h-4 w-4 shrink-0 text-muted-2 transition-transform duration-200 ${
                  isOpen ? "rotate-45" : ""
                }`}
                aria-hidden="true"
              />
            </button>
            {isOpen && (
              <p className="px-4 pb-4 text-sm leading-relaxed text-muted">
                {faq.a}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
