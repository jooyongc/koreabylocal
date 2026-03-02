import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <>
      <Helmet>
        <title>Order #{id} | Korea By Local</title>
        <meta name="description" content="View order details and tracking information." />
      </Helmet>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold text-primary">Order #{id}</h1>
      </div>
    </>
  );
}
