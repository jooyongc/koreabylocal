// Shared by the FAQ accordion and the FAQPage JSON-LD (AEO/SEO).
export interface Faq {
  q: string;
  a: string;
}

export const HOME_FAQS: Faq[] = [
  {
    q: "Are your travel guides written by AI?",
    a: "Most aren't. Guides are written by Diana Park and the Korea by Local team, who live here. A few started as an AI draft, and every one is reviewed by our team before it's published. Nothing is scraped.",
  },
  {
    q: "How does Ask a Local work?",
    a: "Pick a question type — Ask Anything or Restaurant Reservation for $1, Trip Schedule Check or K-Beauty Shipping Request for $5 — submit it, and someone on our team in Korea replies personally by email.",
  },
  {
    q: "Are the e-books free?",
    a: "Two are free — the 10-Step Korea Prep Guide and the Muslim-Friendly Busan Guide — just leave your email. The full Muslim-Friendly Busan Guide 2026 is a paid e-book for travelers who want more depth.",
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
