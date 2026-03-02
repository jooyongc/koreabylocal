import { Helmet } from "react-helmet-async";
import { ProductListPage } from "@/components/product";

export default function PrintPage() {
  return (
    <>
      <Helmet>
        <title>Print | Korea By Local Shop</title>
        <meta
          name="description"
          content="Browse Korean art prints and photography for your home."
        />
      </Helmet>
      <ProductListPage
        rootCategorySlug="shop"
        initialSubcategory="print"
        title="Print"
        description="Korean art prints and photography."
      />
    </>
  );
}
