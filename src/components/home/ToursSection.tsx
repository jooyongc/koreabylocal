import { useProductsByCategory } from "@/hooks/useProductsByCategory";
import SectionHeader from "./SectionHeader";
import ProductCard from "./ProductCard";
import { ProductCardSkeleton } from "@/components/common/Skeleton";

export default function ToursSection() {
  const { data: products, isLoading } = useProductsByCategory("tours", 8);

  // Sort BEST badge products first
  const sorted = products?.slice().sort((a, b) => {
    const aHasBest = a.badges?.includes("BEST") ? 0 : 1;
    const bHasBest = b.badges?.includes("BEST") ? 0 : 1;
    return aHasBest - bHasBest;
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <SectionHeader
        title="Curated Tours"
        subtitle="Popular tours selected by local experts"
        action={{ label: "VIEW ALL", href: "/tours" }}
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))
          : sorted?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
      </div>

      {!isLoading && (!products || products.length === 0) && (
        <p className="py-8 text-center text-text-secondary">
          No tours available at the moment.
        </p>
      )}
    </section>
  );
}
