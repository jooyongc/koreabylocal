import { Helmet } from "react-helmet-async";
import { ProductListPage } from "@/components/product";

export default function TransfersPage() {
  return (
    <>
      <Helmet>
        <title>Transfers | Korea By Local</title>
        <meta
          name="description"
          content="Browse all transfer services including transportation and tour planning."
        />
      </Helmet>
      <ProductListPage
        rootCategorySlug="transfers"
        title="Transfers"
        description="Airport pickup, drop-off & concierge services for your Korean adventure."
      />
    </>
  );
}
