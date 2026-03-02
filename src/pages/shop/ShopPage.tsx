import { Helmet } from "react-helmet-async";
import { ProductListPage } from "@/components/product";

export default function ShopPage() {
  return (
    <>
      <Helmet>
        <title>Shop | Korea By Local</title>
        <meta
          name="description"
          content="Shop authentic Korean goods, magazines, and prints curated by locals."
        />
      </Helmet>
      <ProductListPage
        rootCategorySlug="shop"
        title="Shop"
        description="Authentic Korean goods curated by locals."
      />
    </>
  );
}
