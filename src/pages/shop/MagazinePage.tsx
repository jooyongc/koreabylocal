import { Helmet } from "react-helmet-async";
import { ProductListPage } from "@/components/product";

export default function MagazinePage() {
  return (
    <>
      <Helmet>
        <title>Magazine | Korea By Local Shop</title>
        <meta
          name="description"
          content="Browse our collection of Korean culture and travel magazines."
        />
      </Helmet>
      <ProductListPage
        rootCategorySlug="shop"
        initialSubcategory="magazine"
        title="Magazine"
        description="Korean culture and travel magazines."
      />
    </>
  );
}
