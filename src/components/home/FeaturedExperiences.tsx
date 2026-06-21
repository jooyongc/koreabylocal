import SectionHeading from "./SectionHeading";
import ExperienceCard, { experienceToCard } from "@/components/experiences/ExperienceCard";
import { SAMPLE_EXPERIENCES } from "@/data/sampleExperiences";
import { useExperiences } from "@/hooks/useConcepts";
import { useReveal } from "@/hooks/useReveal";

export default function FeaturedExperiences() {
  const ref = useReveal<HTMLElement>();
  const { data } = useExperiences({ limit: 6 });
  const items = data && data.length ? data.map(experienceToCard) : SAMPLE_EXPERIENCES;

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
        {items.map((x) => (
          <ExperienceCard key={x.title} x={x} />
        ))}
      </div>
    </section>
  );
}
