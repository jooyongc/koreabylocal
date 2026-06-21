// Shared by the FAQ accordion and the FAQPage JSON-LD (AEO/SEO).
export interface Faq {
  q: string;
  a: string;
}

export const HOME_FAQS: Faq[] = [
  {
    q: "Are tours private or shared groups?",
    a: "Most experiences are private by default — just you and your local host. Look for the “Private” badge on each listing. A few signature group tours (capped at 8) are clearly marked so you always know what you’re booking.",
  },
  {
    q: "Does the price include hotel pickup?",
    a: "Yes — for tours and transfers, door-to-door pickup from your Seoul, Busan or Jeju accommodation is included in the listed price. You’ll confirm your address at checkout and your host messages you the evening before.",
  },
  {
    q: "Can I cancel and get a refund?",
    a: "Absolutely. Cancel up to 24 hours before the start time for a 100% refund, processed back to your original payment method within 3–5 business days. No fees, no forms.",
  },
  {
    q: "Which languages do hosts speak?",
    a: "All hosts are fluent in English. Many also speak Japanese, Chinese (Mandarin) or Spanish — the languages are listed on each host card so you can match before you book.",
  },
  {
    q: "How do I pay, and is it secure?",
    a: "We accept PayPal and all major cards (Visa, Mastercard, Amex) through an SSL-encrypted, PCI-DSS compliant checkout. Your card details never touch our servers.",
  },
];
