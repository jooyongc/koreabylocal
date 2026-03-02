import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";

export default function BlogEditPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <>
      <Helmet>
        <title>Edit Blog Post | Korea By Local Admin</title>
      </Helmet>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold text-primary">Edit Blog Post #{id}</h1>
      </div>
    </>
  );
}
