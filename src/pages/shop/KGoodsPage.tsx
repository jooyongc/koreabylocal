import { Helmet } from "react-helmet-async";
import { ProductListPage } from "@/components/product";

export default function KGoodsPage() {
  return (
    <>
      <Helmet>
        <title>K-Goods | Korea By Local Shop</title>
        <meta
          name="description"
          content="Discover unique Korean goods and souvenirs selected by locals."
        />
      </Helmet>
      <ProductListPage
        rootCategorySlug="shop"
        initialSubcategory="k-goods"
        title="K-Goods"
        description="Unique Korean goods and souvenirs."
      />
    </>
  );
}
