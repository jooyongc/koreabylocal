import { Link } from "react-router-dom";

interface LogoProps {
  shrink?: boolean;
  /** Use on dark backgrounds (e.g. the footer) — swaps "Korea by" from ink to white. */
  inverted?: boolean;
  className?: string;
}

/** "Korea by Local" wordmark. "Korea by" in ink (white when inverted), "Local" in accent. */
export default function Logo({ shrink = false, inverted = false, className = "" }: LogoProps) {
  return (
    <Link
      to="/"
      aria-label="Korea by Local — home"
      className={`inline-flex items-baseline gap-[3px] font-display font-extrabold ${
        shrink ? "text-[19px]" : "text-[22px]"
      } ${className}`}
    >
      <span className={inverted ? "text-white" : "text-ink"}>Korea by</span>
      <span className="text-accent">Local</span>
    </Link>
  );
}
