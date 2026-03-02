import { Helmet } from "react-helmet-async";

export default function ProductNewPage() {
  return (
    <>
      <Helmet>
        <title>New Product | Korea By Local Admin</title>
      </Helmet>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold text-primary">New Product</h1>
        <p className="mt-2 text-text-secondary">Create a new product listing.</p>
      </div>
    </>
  );
}
