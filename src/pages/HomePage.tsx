import PageSEO from "@/components/common/PageSEO";
import {
  HeroSection,
  TransferSection,
  BlogSection,
  ToursSection,
  KGoodsSection,
  NewsletterSection,
} from "@/components/home";

const ORG_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Korea By Local",
  url: "https://koreabylocal.com",
  logo: "https://koreabylocal.com/og-default.png",
  description:
    "Authentic Korean travel experiences curated by locals. Tours, transfers, K-goods, and more.",
  sameAs: [],
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
    target: "https://koreabylocal.com/shop?search={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default function HomePage() {
  return (
    <>
      <PageSEO
        title="Korea By Local - Authentic Korean Experiences by Locals"
        description="Discover authentic Korean travel experiences curated by locals. Tours, transfers, K-goods, and more."
        path="/"
        jsonLd={[ORG_SCHEMA, WEBSITE_SCHEMA]}
      />
      <HeroSection />
      <TransferSection />
      <BlogSection />
      <ToursSection />
      <KGoodsSection />
      <NewsletterSection />
    </>
  );
}
