import { Helmet } from "react-helmet-async";

export default function ProductsPage() {
  return (
    <>
      <Helmet>
        <title>Product Management | Korea By Local Admin</title>
      </Helmet>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold text-primary">Product Management</h1>
        <p className="mt-2 text-text-secondary">Manage all products in the shop.</p>
      </div>
    </>
  );
}
