import PageSEO from "@/components/common/PageSEO";
import Hero from "@/components/home/Hero";
import CategoryGrid from "@/components/home/CategoryGrid";
import FeaturedExperiences from "@/components/home/FeaturedExperiences";
import RegionMap from "@/components/home/RegionMap";
import MagazineStrip from "@/components/home/MagazineStrip";
import TrustBar from "@/components/home/TrustBar";
import FaqAccordion from "@/components/home/FaqAccordion";
import NewsletterCta from "@/components/home/NewsletterCta";
import { HOME_FAQS } from "@/data/homeFaqs";

const ORG_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Korea By Local",
  url: "https://koreabylocal.com",
  logo: "https://koreabylocal.com/og-default.png",
  description:
    "A magazine of honest local guides and verified-local experiences across Korea — tours, transfers, K-goods and free local trip advice.",
  sameAs: ["https://instagram.com/koreabylocal.travel"],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    email: "info@koreabylocal.com",
    availableLanguage: ["English", "Korean"],
  },
};

const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Korea By Local",
  url: "https://koreabylocal.com",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://koreabylocal.com/blog?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

// AEO/SEO: FAQPage structured data for Google & AI answer engines.
const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: HOME_FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function HomePage() {
  return (
    <>
      <PageSEO
        title="Korea By Local — See Korea the way locals live it"
        description="A magazine of honest local guides and verified-local experiences across Korea — where to eat, when to go, what to skip. Tours, transfers, K-goods and free local trip advice."
        path="/"
        jsonLd={[ORG_SCHEMA, WEBSITE_SCHEMA, FAQ_SCHEMA]}
      />
      <Hero />
      <CategoryGrid />
      <FeaturedExperiences />
      <RegionMap />
      <MagazineStrip />
      <TrustBar />
      <FaqAccordion />
      <NewsletterCta />
    </>
  );
}
