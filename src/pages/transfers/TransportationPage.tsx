import PageSEO from "@/components/common/PageSEO";
import { ProductListPage } from "@/components/product";
import TripGenieBanner from "@/components/home/TripGenieBanner";

export default function TransportationPage() {
  return (
    <>
      <PageSEO
        title="Transportation | Korea By Local"
        description="Airport transfers, private cars, and reliable transportation services across Korea. Comfortable rides with experienced local drivers."
        path="/transfers/transportation"
      />
      <ProductListPage
        rootCategorySlug="transfers"
        initialSubcategory="transportation"
        title="Transportation"
        description="Airport transfers and transportation services."
      />
      <TripGenieBanner
        title="Not sure which ride fits your trip?"
        subtitle="Ask a real local before you book."
      />
    </>
  );
}
