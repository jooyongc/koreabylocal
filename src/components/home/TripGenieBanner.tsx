import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface TripGenieBannerProps {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  to?: string;
}

export default function TripGenieBanner({
  title = "Have a question about your trip?",
  subtitle = "Ask a real local in Korea — personal, honest answers for just $1.",
  ctaLabel = "Ask a Local",
  to = "/ask-a-local",
}: TripGenieBannerProps) {
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-[1180px] px-4 pb-[clamp(24px,4vw,40px)] sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-5 rounded-[20px] border-[1.5px] border-ink bg-ink px-4 py-[clamp(40px,6vw,72px)] text-center">
          <h2 className="font-display text-[clamp(26px,3.6vw,40px)] font-extrabold leading-[1.15] tracking-[-0.02em] text-white">
            {title}
          </h2>
          <p className="max-w-[46ch] text-[15.5px] leading-[1.6] text-white/75">{subtitle}</p>
          <Link
            to={to}
            className="mt-1 flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-[14.5px] font-bold text-white transition-opacity hover:opacity-90"
          >
            {ctaLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
