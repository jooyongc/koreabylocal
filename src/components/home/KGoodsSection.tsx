import { useProductsByCategory } from "@/hooks/useProductsByCategory";
import SectionHeader from "./SectionHeader";
import ProductCard from "./ProductCard";
import { ProductCardSkeleton } from "@/components/common/Skeleton";

export default function KGoodsSection() {
  const { data: products, isLoading } = useProductsByCategory("k-goods", 8);

  return (
    <section className="bg-background-gray py-16">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          title="K-Goods"
          subtitle="Authentic Korean goods delivered worldwide"
          action={{ label: "VIEW ALL", href: "/shop/k-goods" }}
        />

        <div className="scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 lg:grid-cols-3 xl:grid-cols-4">
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
            No K-Goods available at the moment.
          </p>
        )}
      </div>
    </section>
  );
}
