import PageSEO from "@/components/common/PageSEO";
import { ProductListPage } from "@/components/product";

export default function ToursPage() {
  return (
    <>
      <PageSEO
        title="Curated Tours | Korea By Local"
        description="Explore curated Korean tours designed by locals for an authentic experience. Discover hidden gems, cultural sites, and unique Korean adventures."
        path="/tours"
      />
      <ProductListPage
        rootCategorySlug="tours"
        title="Curated Tours"
        description="Authentic Korean experiences curated by locals."
      />
    </>
  );
}
