import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import AffiliateExperienceCard from "@/components/experiences/AffiliateExperienceCard";
import { useAffiliateExperiences } from "@/hooks/useConcepts";

export default function CuratedExperiences() {
  const { data } = useAffiliateExperiences({ limit: 6 });
  const items = data ?? [];

  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1180px] px-4 py-[clamp(28px,4vw,44px)] sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-[clamp(24px,3vw,34px)] font-extrabold tracking-[-0.02em] text-ink">
            Curated Experiences
          </h2>
          <p className="mt-1.5 text-[15px] text-muted">Hand-picked tours &amp; activities from our partners</p>
        </div>
        <Link
          to="/experiences"
          className="inline-flex items-center gap-1.5 text-[14px] font-bold text-accent transition-colors hover:text-accent-dark"
        >
          Browse All Experiences <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
        {items.map((x) => (
          <AffiliateExperienceCard key={x.id} x={x} />
        ))}
      </div>
    </section>
  );
}
