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
    a: "Every hotel listed is one we've featured in our Instagram Reels — hand-picked by locals and checked for what it's actually good at before we recommend it.",
  },
  {
    q: "How do I pay, and is it secure?",
    a: "Everything — e-books, Ask a Local, event tickets — goes through PayPal's secure checkout. Paid purchases come with a 7-day refund if it's not for you.",
  },
];
