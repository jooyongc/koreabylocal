import { Link } from "react-router-dom";

interface LogoProps {
  shrink?: boolean;
  /** Use the all-white wordmark (for dark backgrounds). */
  white?: boolean;
  className?: string;
}

/** Official "Korea by Local" wordmark. Source manual: brand/koreabylocal-logo-manual.ai */
export default function Logo({ shrink = false, white = false, className = "" }: LogoProps) {
  return (
    <Link
      to="/"
      aria-label="Korea by Local — home"
      className={`inline-flex items-center ${className}`}
    >
      <img
        src={white ? "/logo-white.png" : "/logo.png"}
        alt="Korea by Local"
        width={606}
        height={120}
        className={`w-auto ${shrink ? "h-7" : "h-8"}`}
        decoding="async"
      />
    </Link>
  );
}
