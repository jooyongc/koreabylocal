import PageSEO from "@/components/common/PageSEO";
import NewsletterBanner from "@/components/home/NewsletterBanner";
import Hero from "@/components/home/Hero";
import AreaFilter from "@/components/home/AreaFilter";
import TypeFilter from "@/components/home/TypeFilter";
import SpotGrid from "@/components/home/SpotGrid";
import EbookBanner from "@/components/home/EbookBanner";
import TripGenieBanner from "@/components/home/TripGenieBanner";

const ORG_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Korea By Local",
  url: "https://koreabylocal.com",
  logo: "https://koreabylocal.com/og-default.png",
  description:
    "A curated gallery of honest local spots across Korea — cafés, alleys and hidden gems, hand-picked by locals, never an algorithm.",
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
    target: "https://koreabylocal.com/guidebook?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default function HomePage() {
  return (
    <>
      <PageSEO
        title="Korea by Local — See Korea the way locals live it"
        description="A curated gallery of honest local spots across Korea — cafés, alleys and hidden gems. Hand-picked by locals, never an algorithm, never an ad."
        path="/"
        jsonLd={[ORG_SCHEMA, WEBSITE_SCHEMA]}
      />
      <NewsletterBanner />
      <Hero />
      <AreaFilter />
      <TypeFilter />
      <SpotGrid />
      <EbookBanner />
      <TripGenieBanner />
    </>
  );
}
