import PageSEO from "@/components/common/PageSEO";
import { ProductListPage } from "@/components/product";

export default function TransfersPage() {
  return (
    <>
      <PageSEO
        title="Transfers | Korea By Local"
        description="Reliable airport transfers, private transportation, and tour planning services across Korea. Comfortable rides with local drivers."
        path="/transfers"
      />
      <ProductListPage
        rootCategorySlug="transfers"
        title="Transfers"
        description="Airport pickup, drop-off & concierge services for your Korean adventure."
      />
    </>
  );
}
