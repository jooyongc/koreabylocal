import PageSEO from "@/components/common/PageSEO";
import { useParams } from "react-router-dom";

export default function TourDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <>
      <PageSEO
        title="Tour Detail | Korea By Local"
        description="Discover the details of this curated Korean tour experience designed by locals."
        path={`/tours/${slug ?? ""}`}
      />
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold text-primary">Tour: {slug}</h1>
      </div>
    </>
  );
}
