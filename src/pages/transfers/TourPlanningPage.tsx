import { Helmet } from "react-helmet-async";
import { ProductListPage } from "@/components/product";

export default function TourPlanningPage() {
  return (
    <>
      <Helmet>
        <title>Tour Planning | Korea By Local</title>
        <meta
          name="description"
          content="Custom tour planning services by local Korean experts."
        />
      </Helmet>
      <ProductListPage
        rootCategorySlug="transfers"
        initialSubcategory="tour-planning"
        title="Tour Planning"
        description="Plan your perfect Korean trip with local experts."
      />
    </>
  );
}
