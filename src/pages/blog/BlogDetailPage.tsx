import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <>
      <Helmet>
        <title>Blog Post | Korea By Local</title>
        <meta name="description" content="Read this article about Korean culture and travel." />
      </Helmet>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold text-primary">Post: {slug}</h1>
      </div>
    </>
  );
}
