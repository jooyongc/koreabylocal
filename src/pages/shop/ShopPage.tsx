import PageSEO from "@/components/common/PageSEO";
import { ProductListPage } from "@/components/product";

export default function ShopPage() {
  return (
    <>
      <PageSEO
        title="Shop | Korea By Local"
        description="Shop authentic Korean goods, magazines, and prints curated by locals. From K-beauty to traditional crafts, find unique Korean products."
        path="/shop"
      />
      <ProductListPage
        rootCategorySlug="shop"
        title="Shop"
        description="Authentic Korean goods curated by locals."
      />
    </>
  );
}
