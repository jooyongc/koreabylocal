import { Link } from "react-router-dom";
import OptimizedImage from "@/components/common/OptimizedImage";
import type { Product } from "@/types";

const BADGE_COLORS: Record<string, string> = {
  BEST: "bg-blue-600",
  NEW: "bg-emerald-500",
  HOT: "bg-red-500",
  MD: "bg-purple-600",
  SALE: "bg-red-600",
  "TIME SALE": "bg-red-600",
};

function formatPrice(price: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export default function ProductCard({ product }: { product: Product }) {
  const hasDiscount = product.compare_price != null && product.compare_price > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.compare_price! - product.price) / product.compare_price!) * 100)
    : 0;

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group block min-w-[260px] overflow-hidden rounded-xl border border-gray-100 bg-white transition-shadow hover:shadow-lg"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] overflow-hidden bg-background-gray">
        {product.thumbnail_url ? (
          <OptimizedImage
            src={product.thumbnail_url}
            alt={product.title}
            preset="card"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-text-secondary/40">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Badges */}
        {product.badges && product.badges.length > 0 && (
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            {product.badges.map((badge) => (
              <span
                key={badge}
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase text-white ${BADGE_COLORS[badge] ?? "bg-gray-600"}`}
              >
                {badge}
              </span>
            ))}
          </div>
        )}

        {/* Discount badge */}
        {hasDiscount && (
          <span className="absolute right-2 top-2 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
            -{discountPct}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="line-clamp-2 text-sm font-medium text-primary group-hover:text-primary-light transition-colors">
          {product.title}
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-primary">
            {formatPrice(product.price, product.currency)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-text-secondary line-through">
              {formatPrice(product.compare_price!, product.currency)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
