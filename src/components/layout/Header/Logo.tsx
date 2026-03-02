import { Link } from "react-router-dom";

interface LogoProps {
  shrink?: boolean;
  white?: boolean;
}

export default function Logo({ shrink = false, white = false }: LogoProps) {
  const mainColor = white ? "#ffffff" : "#1B2541";
  const subColor = white ? "rgba(255,255,255,0.7)" : "#1B2541";
  const size = shrink ? "text-lg" : "text-xl md:text-2xl";

  return (
    <Link to="/" className="flex items-center gap-0.5 transition-all duration-300">
      <span className={`${size} font-extrabold tracking-tight`} style={{ color: mainColor }}>
        Korea
      </span>
      <span className="relative mx-0.5">
        <span className={`${shrink ? "text-xs" : "text-sm"} font-normal`} style={{ color: subColor }}>
          by
        </span>
        <svg
          className="absolute -bottom-1 left-1/2 -translate-x-1/2"
          width={shrink ? 18 : 22}
          height={shrink ? 8 : 10}
          viewBox="0 0 22 10"
          fill="none"
        >
          <path
            d="M2 2C6 8 16 8 20 2"
            stroke="#E84B8A"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className={`${size} font-extrabold tracking-tight`} style={{ color: mainColor }}>
        Local
      </span>
    </Link>
  );
}
