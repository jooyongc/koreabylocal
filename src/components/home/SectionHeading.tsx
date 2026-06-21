import { Link } from "react-router-dom";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  link?: { label: string; to: string };
  dark?: boolean;
}

/** Eyebrow label + display title, with an optional underlined "see all" link. */
export default function SectionHeading({ eyebrow, title, link, dark }: SectionHeadingProps) {
  return (
    <div className="mb-[26px] flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
          {eyebrow}
        </div>
        <h2
          className={`mt-2 font-display text-[clamp(26px,3.6vw,40px)] font-extrabold tracking-[-0.02em] ${
            dark ? "text-white" : "text-ink"
          }`}
        >
          {title}
        </h2>
      </div>
      {link && (
        <Link
          to={link.to}
          className={`flex items-center gap-1.5 border-b-2 border-accent pb-[3px] text-sm font-bold ${
            dark ? "text-white" : "text-ink"
          }`}
        >
          {link.label} →
        </Link>
      )}
    </div>
  );
}
