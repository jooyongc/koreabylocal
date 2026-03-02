import PageSEO from "@/components/common/PageSEO";
import { ProductListPage } from "@/components/product";

export default function KGoodsPage() {
  return (
    <>
      <PageSEO
        title="K-Goods | Korea By Local Shop"
        description="Discover unique Korean goods and souvenirs selected by locals. From K-beauty to traditional crafts and trending lifestyle items."
        path="/shop/k-goods"
      />
      <ProductListPage
        rootCategorySlug="shop"
        initialSubcategory="k-goods"
        title="K-Goods"
        description="Unique Korean goods and souvenirs."
      />
    </>
  );
}
