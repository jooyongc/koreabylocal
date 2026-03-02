import { Helmet } from "react-helmet-async";
import { ProductListPage } from "@/components/product";

export default function ToursPage() {
  return (
    <>
      <Helmet>
        <title>Curated Tours | Korea By Local</title>
        <meta
          name="description"
          content="Explore curated Korean tours designed by locals for an authentic experience."
        />
      </Helmet>
      <ProductListPage
        rootCategorySlug="tours"
        title="Curated Tours"
        description="Authentic Korean experiences curated by locals."
      />
    </>
  );
}
