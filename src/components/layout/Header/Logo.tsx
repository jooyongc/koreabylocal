import { Link } from "react-router-dom";

interface LogoProps {
  shrink?: boolean;
  /** Use on dark backgrounds (e.g. the footer) — swaps to the white/pink variant. */
  inverted?: boolean;
  className?: string;
}

/** Official "Korea by Local" logo — navy + hot pink, with the smile mark. */
export default function Logo({ shrink = false, inverted = false, className = "" }: LogoProps) {
  return (
    <Link to="/" aria-label="Korea by Local — home" className={`inline-flex items-center ${className}`}>
      <img
        src={inverted ? "/logo-white.svg" : "/logo.png"}
        alt="Korea by Local"
        className={`w-auto ${shrink ? "h-7" : "h-8"}`}
        decoding="async"
      />
    </Link>
  );
}
