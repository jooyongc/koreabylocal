import SectionHeading from "./SectionHeading";
import ExperienceCard, { experienceToCard } from "@/components/experiences/ExperienceCard";
import { useExperiences } from "@/hooks/useConcepts";
import { useReveal } from "@/hooks/useReveal";

export default function FeaturedExperiences() {
  const ref = useReveal<HTMLElement>();
  const { data, isLoading } = useExperiences({ limit: 6 });

  if (!isLoading && (!data || data.length === 0)) return null;

  return (
    <section
      ref={ref}
      className="reveal mx-auto max-w-[1180px] px-4 pt-[clamp(44px,6vw,80px)] sm:px-6 lg:px-8"
    >
      <SectionHeading
        eyebrow="Experiences · affiliate partners"
        title="Featured experiences"
        link={{ label: "Browse all", to: "/tours" }}
      />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(270px,1fr))] gap-[18px]">
        {(data ?? []).map((row) => (
          <ExperienceCard key={row.id} x={experienceToCard(row)} />
        ))}
      </div>
    </section>
  );
}
