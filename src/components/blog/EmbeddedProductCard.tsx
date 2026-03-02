import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useEmbeddedProduct } from "@/hooks/useEmbeddedProduct";

interface EmbeddedProductCardProps {
  productId: number;
}

export default function EmbeddedProductCard({
  productId,
}: EmbeddedProductCardProps) {
  const { data: product, isLoading } = useEmbeddedProduct(productId);

  if (isLoading) {
    return (
      <div className="my-6 animate-pulse rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex gap-4">
          <div className="h-24 w-24 shrink-0 rounded-lg bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-gray-200" />
            <div className="h-4 w-1/2 rounded bg-gray-200" />
            <div className="h-4 w-1/4 rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const price = product.compare_price ?? product.price;
  const hasDiscount =
    product.compare_price != null && product.compare_price < product.price;

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group my-6 flex gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
    >
      {/* Thumbnail */}
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-background-gray">
        {product.thumbnail_url ? (
          <img
            src={product.thumbnail_url}
            alt={product.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-text-secondary/40">
            <ShoppingBag className="h-8 w-8" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <span className="text-[10px] font-bold uppercase text-accent">
          Product
        </span>
        <h4 className="line-clamp-2 text-sm font-semibold text-primary transition-colors group-hover:text-primary-light">
          {product.title}
        </h4>
        <div className="mt-1 flex items-center gap-2">
          {hasDiscount && (
            <span className="text-xs text-text-secondary line-through">
              ₩{product.price.toLocaleString()}
            </span>
          )}
          <span className="text-sm font-bold text-primary">
            ₩{price.toLocaleString()}
          </span>
        </div>
      </div>
    </Link>
  );
}
