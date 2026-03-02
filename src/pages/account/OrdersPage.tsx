import { Helmet } from "react-helmet-async";

export default function OrdersPage() {
  return (
    <>
      <Helmet>
        <title>My Orders | Korea By Local</title>
        <meta name="description" content="View your order history and track current orders." />
      </Helmet>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold text-primary">My Orders</h1>
        <p className="mt-2 text-text-secondary">View and track your orders.</p>
      </div>
    </>
  );
}
