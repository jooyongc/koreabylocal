import { useProductsByCategory } from "@/hooks/useProductsByCategory";
import SectionHeader from "./SectionHeader";
import ProductCard from "./ProductCard";
import { ProductCardSkeleton } from "@/components/common/Skeleton";

export default function TransferSection() {
  const { data: products, isLoading } = useProductsByCategory("transfers", 4);

  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <SectionHeader
        title="Transfer"
        subtitle="Airport pickup, drop-off & concierge services"
        action={{ label: "VIEW ALL", href: "/transfers" }}
      />

      {/* Horizontal scroll on mobile, grid on desktop */}
      <div className="scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))
          : products?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
      </div>

      {!isLoading && (!products || products.length === 0) && (
        <p className="py-8 text-center text-text-secondary">
          No transfer services available at the moment.
        </p>
      )}
    </section>
  );
}
