import { Helmet } from "react-helmet-async";
import {
  HeroSection,
  TransferSection,
  BlogSection,
  ToursSection,
  KGoodsSection,
  NewsletterSection,
} from "@/components/home";

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>Korea By Local - Authentic Korean Experiences by Locals</title>
        <meta
          name="description"
          content="Discover authentic Korean travel experiences curated by locals. Tours, transfers, K-goods, and more."
        />
      </Helmet>
      <HeroSection />
      <TransferSection />
      <BlogSection />
      <ToursSection />
      <KGoodsSection />
      <NewsletterSection />
    </>
  );
}
