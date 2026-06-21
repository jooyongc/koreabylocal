import { Clock } from "lucide-react";
import { Link } from "react-router-dom";

export interface TransferRoute {
  route: string;
  type: string;
  time: string;
  price: string;
  img: string;
}

interface RouteCardProps {
  route: TransferRoute;
  /** Where the card links to (a product/booking surface). */
  to: string;
}

/** A "Popular routes" list card: thumbnail + route, type, time and price. */
export default function RouteCard({ route, to }: RouteCardProps) {
  return (
    <Link
      to={to}
      aria-label={`Book transfer: ${route.route}, ${route.type}, ${route.price}`}
      className="flex items-center gap-3.5 rounded-[18px] bg-white p-3.5 text-left shadow-[0_8px_26px_rgba(16,15,44,0.07)] transition-shadow duration-300 hover:shadow-[0_20px_44px_rgba(16,15,44,0.16)]"
    >
      <img
        src={route.img}
        alt={route.route}
        loading="lazy"
        className="h-[84px] w-[84px] flex-none rounded-[14px] object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="font-display text-[15.5px] font-bold leading-tight text-ink">
          {route.route}
        </div>
        <div className="mt-1.5 text-[12.5px] text-muted-2">{route.type}</div>
        <div className="mt-2.5 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-xs text-muted-2">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {route.time}
          </span>
          <span className="font-display text-[18px] font-extrabold text-ink">
            {route.price}
          </span>
        </div>
      </div>
    </Link>
  );
}
