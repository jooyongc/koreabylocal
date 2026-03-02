import { Helmet } from "react-helmet-async";

export default function BlogPage() {
  return (
    <>
      <Helmet>
        <title>Blog | Korea By Local</title>
        <meta name="description" content="Read stories, tips, and insights about Korea from local experts." />
      </Helmet>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold text-primary">Blog</h1>
        <p className="mt-2 text-text-secondary">Stories and insights from Korean locals.</p>
      </div>
    </>
  );
}
