import { Link } from "react-router-dom";
import {
  ArrowRight,
  Map,
  Car,
  ShoppingBag,
  MessageCircle,
  Loader2,
} from "lucide-react";
import PageSEO from "@/components/common/PageSEO";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import TrustBar from "@/components/home/TrustBar";
import FaqAccordion from "@/components/home/FaqAccordion";
import { HOME_FAQS } from "@/data/homeFaqs";

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

interface HeroData {
  title: string;
  subtitle: string;
  bg_gradient: string;
}

interface MissionData {
  title: string;
  text: string;
  vision_title: string;
  vision_text: string;
}

interface OfferItem {
  icon: string;
  title: string;
  description: string;
}

interface OffersData {
  title: string;
  subtitle: string;
  items: OfferItem[];
}

interface StatItem {
  value: string;
  label: string;
}

interface TeamData {
  title: string;
  subtitle: string;
  description: string;
  stats: StatItem[];
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Map,
  Car,
  ShoppingBag,
  MessageCircle,
};

export default function AboutPage() {
  const { data: hero, isLoading: heroLoading } =
    useSiteSettings<HeroData>("about_hero");
  const { data: mission } = useSiteSettings<MissionData>("about_mission");
  const { data: offers } = useSiteSettings<OffersData>("about_offers");
  const { data: team } = useSiteSettings<TeamData>("about_team");

  if (heroLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <PageSEO
        title="About Us | Korea By Local"
        description="Learn about Korea By Local and our mission to share authentic Korean experiences through local connections."
        path="/about"
        jsonLd={FAQ_SCHEMA}
      />

      {/* Hero Section */}
      <section
        className={`relative flex min-h-[60vh] items-center justify-center px-4 md:min-h-[70vh] bg-gradient-to-br ${hero?.bg_gradient ?? "from-[#00005a] via-[#2a1a6e] to-[#6312ff]"}`}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 mx-auto max-w-3xl text-center text-white">
          <h1 className="whitespace-pre-line text-3xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            {hero?.title ?? "More than travel,\nit's connection."}
          </h1>
          <p className="mt-6 text-base font-light leading-relaxed tracking-wide text-white/85 md:text-lg lg:text-xl">
            {hero?.subtitle ?? ""}
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      {mission && (
        <section className="mx-auto max-w-5xl px-4 py-16 md:py-24">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-primary md:text-3xl">
                {mission.title}
              </h2>
              <div className="mt-3 h-1 w-16 rounded bg-gradient-to-r from-primary to-accent" />
              <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-text-secondary md:text-base">
                {mission.text}
              </p>
            </div>
            <div className="flex flex-col justify-center">
              <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 p-8">
                <h3 className="text-xl font-bold text-primary md:text-2xl">
                  {mission.vision_title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-text-secondary md:text-base">
                  {mission.vision_text}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* What We Offer */}
      {offers && (
        <section className="bg-gray-50 py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary md:text-3xl">
                {offers.title}
              </h2>
              <p className="mt-2 text-sm text-text-secondary md:text-base">
                {offers.subtitle}
              </p>
              <div className="mx-auto mt-3 h-1 w-16 rounded bg-gradient-to-r from-primary to-accent" />
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {offers.items.map((item) => {
                const Icon = ICON_MAP[item.icon];
                return (
                  <div
                    key={item.title}
                    className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-primary/20 hover:shadow-lg"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                      {Icon && <Icon className="h-6 w-6" />}
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-gray-900">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Team / Stats */}
      {team && (
        <section className="mx-auto max-w-5xl px-4 py-16 md:py-24">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary md:text-3xl">
              {team.title}
            </h2>
            <p className="mt-2 text-sm text-text-secondary md:text-base">
              {team.subtitle}
            </p>
            <div className="mx-auto mt-3 h-1 w-16 rounded bg-gradient-to-r from-primary to-accent" />
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-text-secondary md:text-base">
            {team.description}
          </p>
          <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4">
            {team.stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 p-6 text-center"
              >
                <p className="text-3xl font-bold text-primary md:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <TrustBar />
      <FaqAccordion />

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-[#00005a] via-[#2a1a6e] to-[#6312ff] py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center text-white">
          <h2 className="text-2xl font-bold md:text-4xl">
            Ready to explore Korea like a local?
          </h2>
          <p className="mt-4 text-base text-white/80 md:text-lg">
            Browse our curated local spots, or ask our locals anything about
            Korea.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-semibold text-primary transition-all hover:bg-white/90 md:text-base"
            >
              Explore Spots
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/ask-a-local"
              className="group inline-flex items-center gap-2 rounded-full border-2 border-white/80 px-8 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white hover:text-primary md:text-base"
            >
              Ask a Local
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
