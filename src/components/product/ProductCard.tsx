import { Link } from "react-router-dom";
import type { ProductWithCategory } from "@/hooks/useProductList";

const BADGE_COLORS: Record<string, string> = {
  NEW: "bg-blue-500",
  BEST: "bg-red-500",
  HOT: "bg-orange-500",
  MD: "bg-purple-500",
  SALE: "bg-emerald-500",
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

function getSecondImage(images: unknown): string | null {
  if (!images || !Array.isArray(images)) return null;
  const urls = images.filter((img): img is string => typeof img === "string");
  return urls[1] ?? null;
}

interface ProductCardProps {
  product: ProductWithCategory;
  view?: "grid" | "list";
}

export default function ProductCard({ product, view = "grid" }: ProductCardProps) {
  const hasDiscount =
    product.compare_price != null && product.compare_price > product.price;
  const discountPct = hasDiscount
    ? Math.round(
        ((product.compare_price! - product.price) / product.compare_price!) * 100,
      )
    : 0;
  const secondImage = getSecondImage(product.images);
  const isSoldOut = product.status === "sold_out";

  /* ─── List view ─────────────────────────────────────────── */
  if (view === "list") {
    return (
      <Link
        to={`/product/${product.slug}`}
        className="group flex gap-4 overflow-hidden rounded-xl border border-gray-100 bg-white p-3 transition-shadow hover:shadow-lg"
      >
        {/* Thumbnail */}
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-background-gray sm:h-36 sm:w-36">
          {product.thumbnail_url ? (
            <img
              src={product.thumbnail_url}
              alt={product.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <ImagePlaceholder />
          )}
          {isSoldOut && <SoldOutOverlay />}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col justify-center gap-1">
          <Badges badges={product.badges} />
          {product.categories && (
            <span className="text-xs text-text-secondary">
              {product.categories.name}
            </span>
          )}
          <h3 className="line-clamp-2 text-sm font-medium text-primary transition-colors group-hover:text-primary-light">
            {product.title}
          </h3>
          <PriceDisplay
            price={product.price}
            comparePrice={product.compare_price}
            currency={product.currency}
            hasDiscount={hasDiscount}
          />
        </div>
      </Link>
    );
  }

  /* ─── Grid view (default) ───────────────────────────────── */
  return (
    <Link
      to={`/product/${product.slug}`}
      className="group block overflow-hidden rounded-xl border border-gray-100 bg-white transition-shadow hover:shadow-lg"
    >
      {/* Thumbnail — 1:1 */}
      <div className="relative aspect-square overflow-hidden bg-background-gray">
        {product.thumbnail_url ? (
          <>
            <img
              src={product.thumbnail_url}
              alt={product.title}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
                secondImage ? "group-hover:opacity-0" : ""
              }`}
              loading="lazy"
            />
            {secondImage && (
              <img
                src={secondImage}
                alt={`${product.title} - alternate`}
                className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                loading="lazy"
              />
            )}
          </>
        ) : (
          <ImagePlaceholder />
        )}

        {/* Badges */}
        <Badges badges={product.badges} className="absolute left-2 top-2" />

        {/* Discount tag */}
        {hasDiscount && (
          <span className="absolute right-2 top-2 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            -{discountPct}%
          </span>
        )}

        {/* Sold out overlay */}
        {isSoldOut && <SoldOutOverlay />}
      </div>

      {/* Info */}
      <div className="p-3">
        {product.categories && (
          <span className="text-[11px] font-medium uppercase tracking-wide text-text-secondary">
            {product.categories.name}
          </span>
        )}
        <h3 className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug text-primary transition-colors group-hover:text-primary-light">
          {product.title}
        </h3>
        <PriceDisplay
          price={product.price}
          comparePrice={product.compare_price}
          currency={product.currency}
          hasDiscount={hasDiscount}
          className="mt-2"
        />
      </div>
    </Link>
  );
}

/* ─── Sub-components ──────────────────────────────────────── */

function Badges({
  badges,
  className = "",
}: {
  badges: string[] | null;
  className?: string;
}) {
  if (!badges || badges.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {badges.map((badge) => (
        <span
          key={badge}
          className={`rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${
            BADGE_COLORS[badge] ?? "bg-gray-500"
          }`}
        >
          {badge}
        </span>
      ))}
    </div>
  );
}

function PriceDisplay({
  price,
  comparePrice,
  currency,
  hasDiscount,
  className = "",
}: {
  price: number;
  comparePrice: number | null;
  currency: string;
  hasDiscount: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-baseline gap-2 ${className}`}>
      <span
        className={`text-base font-bold ${hasDiscount ? "text-red-500" : "text-primary"}`}
      >
        {formatPrice(price, currency)}
      </span>
      {hasDiscount && comparePrice != null && (
        <span className="text-xs text-text-secondary line-through">
          {formatPrice(comparePrice, currency)}
        </span>
      )}
    </div>
  );
}

function SoldOutOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
      <span className="rounded-md bg-black/70 px-4 py-2 text-sm font-bold uppercase tracking-wider text-white">
        Sold Out
      </span>
    </div>
  );
}

function ImagePlaceholder() {
  return (
    <div className="flex h-full items-center justify-center text-text-secondary/30">
      <svg
        className="h-12 w-12"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>
  );
}
