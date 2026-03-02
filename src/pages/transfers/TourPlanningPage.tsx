import PageSEO from "@/components/common/PageSEO";
import { ProductListPage } from "@/components/product";

export default function TourPlanningPage() {
  return (
    <>
      <PageSEO
        title="Tour Planning | Korea By Local"
        description="Custom tour planning services by local Korean experts. Design your perfect Korean itinerary with insider knowledge and local recommendations."
        path="/transfers/tour-planning"
      />
      <ProductListPage
        rootCategorySlug="transfers"
        initialSubcategory="tour-planning"
        title="Tour Planning"
        description="Plan your perfect Korean trip with local experts."
      />
    </>
  );
}
