import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <>
      <Helmet>
        <title>Product Detail | Korea By Local</title>
        <meta name="description" content="View product details, options, and pricing." />
      </Helmet>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold text-primary">Product: {slug}</h1>
      </div>
    </>
  );
}
