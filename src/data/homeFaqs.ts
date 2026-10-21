// Shared by the FAQ accordion and the FAQPage JSON-LD (AEO/SEO).
export interface Faq {
  q: string;
  a: string;
}

export const HOME_FAQS: Faq[] = [
  {
    q: "Are your travel guides written by AI?",
    a: "No. Every guide is written and fact-checked by Diana Park and the Korea by Local team, who live here — nothing is scraped or AI-written.",
  },
  {
    q: "How does Ask a Local work?",
    a: "Pick a question type — Ask Anything or Restaurant Reservation for $1, Trip Schedule Check or K-Beauty Shipping Request for $5 — submit it, and a real local replies personally. Average reply time is about 3 hours.",
  },
  {
    q: "Are the e-books free?",
    a: "Our starter guides, like the 10-Step Korea Prep Guide, are free — just leave your email. A paid Complete Guidebook with everything in one place is coming for travelers who want more depth.",
  },
  {
    q: "How do you choose the hotels on Where to Stay?",
    a: "Hotels in Korea's major destinations, personally checked and verified by locals before we list them.",
  },
  {
    q: "How do I pay, and is it secure?",
    a: "Through PayPal — easy and secure for anyone to use.",
  },
];
