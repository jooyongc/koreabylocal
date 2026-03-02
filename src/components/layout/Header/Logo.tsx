import { Link } from "react-router-dom";

interface LogoProps {
  shrink?: boolean;
}

export default function Logo({ shrink = false }: LogoProps) {
  return (
    <Link to="/" className="flex items-center gap-1 font-bold tracking-tight text-primary transition-all duration-300">
      <span className={shrink ? "text-xl" : "text-2xl"}>
        Korea by Local
      </span>
    </Link>
  );
}
