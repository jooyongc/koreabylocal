import { Link } from "react-router-dom";
import { useRelatedProducts } from "@/hooks/useRelatedProducts";
import type { Product } from "@/types";

const BADGE_COLORS: Record<string, string> = {
  NEW: "bg-blue-500",
  BEST: "bg-red-500",
  HOT: "bg-orange-500",
  MD: "bg-purple-500",
  SALE: "bg-emerald-500",
};

function formatPrice(price: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

interface RelatedProductsProps {
  categoryId: number | null | undefined;
  currentProductId: number | undefined;
}

export default function RelatedProducts({
  categoryId,
  currentProductId,
}: RelatedProductsProps) {
  const { data: products } = useRelatedProducts(
    categoryId,
    currentProductId,
    8,
  );

  if (!products || products.length === 0) return null;

  return (
    <section>
      <h2 className="mb-6 text-xl font-bold text-primary">Related Products</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {products.map((product) => (
          <RelatedCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

function RelatedCard({ product }: { product: Product }) {
  const hasDiscount =
    product.compare_price != null && product.compare_price > product.price;

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group block overflow-hidden rounded-xl border border-gray-100 bg-white transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-background-gray">
        {product.thumbnail_url ? (
          <img
            src={product.thumbnail_url}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-text-secondary/30">
            <svg
              className="h-10 w-10"
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
        )}
        {product.badges && product.badges.length > 0 && (
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            {product.badges.map((badge) => (
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
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-primary transition-colors group-hover:text-primary-light">
          {product.title}
        </h3>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span
            className={`text-sm font-bold ${hasDiscount ? "text-red-500" : "text-primary"}`}
          >
            {formatPrice(product.price, product.currency)}
          </span>
          {hasDiscount && product.compare_price != null && (
            <span className="text-xs text-text-secondary line-through">
              {formatPrice(product.compare_price, product.currency)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
