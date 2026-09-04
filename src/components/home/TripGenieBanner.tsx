import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function TripGenieBanner() {
  return (
    <section className="bg-ink">
      <div className="mx-auto flex max-w-[1180px] flex-col items-center gap-5 px-4 py-[clamp(40px,6vw,72px)] text-center sm:px-6 lg:px-8">
        <h2 className="font-display text-[clamp(26px,3.6vw,40px)] font-extrabold leading-[1.15] tracking-[-0.02em] text-white">
          Need help right now?
        </h2>
        <p className="max-w-[46ch] text-[15.5px] leading-[1.6] text-white/75">
          Chat with a real local in Korea — in real time.
        </p>
        <Link
          to="/about"
          className="mt-1 flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-[14.5px] font-bold text-white transition-opacity hover:opacity-90"
        >
          Start Chat <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
