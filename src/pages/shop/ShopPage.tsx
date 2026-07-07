import PageSEO from "@/components/common/PageSEO";
import { ProductListPage } from "@/components/product";

export default function ShopPage() {
  return (
    <>
      <PageSEO
        title="The Shop | Korea By Local"
        description="Korean goods, gifts and prints curated by locals — K-snacks, kimchi and gift sets delivered to your hotel in Seoul."
        path="/shop"
      />
      <ProductListPage
        rootCategorySlug="shop"
        title="The Shop"
        description="Korean goods, gifts and prints — curated by locals, delivered in Seoul."
      />
    </>
  );
}
