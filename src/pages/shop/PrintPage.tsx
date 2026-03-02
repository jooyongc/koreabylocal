import PageSEO from "@/components/common/PageSEO";
import { ProductListPage } from "@/components/product";

export default function PrintPage() {
  return (
    <>
      <PageSEO
        title="Print | Korea By Local Shop"
        description="Browse Korean art prints and photography for your home. Beautiful scenes from Korea captured by local photographers."
        path="/shop/print"
      />
      <ProductListPage
        rootCategorySlug="shop"
        initialSubcategory="print"
        title="Print"
        description="Korean art prints and photography."
      />
    </>
  );
}
