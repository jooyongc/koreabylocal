import { Helmet } from "react-helmet-async";

export default function BlogNewPage() {
  return (
    <>
      <Helmet>
        <title>New Blog Post | Korea By Local Admin</title>
      </Helmet>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold text-primary">New Blog Post</h1>
        <p className="mt-2 text-text-secondary">Write a new article.</p>
      </div>
    </>
  );
}
