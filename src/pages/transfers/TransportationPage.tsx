import { Helmet } from "react-helmet-async";
import { ProductListPage } from "@/components/product";

export default function TransportationPage() {
  return (
    <>
      <Helmet>
        <title>Transportation | Korea By Local</title>
        <meta
          name="description"
          content="Airport transfers, private cars, and transportation services across Korea."
        />
      </Helmet>
      <ProductListPage
        rootCategorySlug="transfers"
        initialSubcategory="transportation"
        title="Transportation"
        description="Airport transfers and transportation services."
      />
    </>
  );
}
