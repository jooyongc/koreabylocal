import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";

export default function ProductEditPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <>
      <Helmet>
        <title>Edit Product | Korea By Local Admin</title>
      </Helmet>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold text-primary">Edit Product #{id}</h1>
      </div>
    </>
  );
}
