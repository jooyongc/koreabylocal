import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";

export default function TourDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <>
      <Helmet>
        <title>Tour Detail | Korea By Local</title>
        <meta name="description" content="Discover the details of this curated Korean tour." />
      </Helmet>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold text-primary">Tour: {slug}</h1>
      </div>
    </>
  );
}
