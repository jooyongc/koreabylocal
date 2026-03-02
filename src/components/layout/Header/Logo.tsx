import { Link } from "react-router-dom";

interface LogoProps {
  shrink?: boolean;
}

export default function Logo({ shrink = false }: LogoProps) {
  return (
    <Link to="/" className="flex items-center transition-all duration-300">
      <img
        src="/logo.svg"
        alt="Korea by Local"
        className={shrink ? "h-8" : "h-10"}
      />
    </Link>
  );
}
