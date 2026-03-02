import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";

export default function AccountPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <>
      <Helmet>
        <title>My Account | Korea By Local</title>
        <meta name="description" content="Manage your Korea By Local account and view your orders." />
      </Helmet>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold text-primary">My Account</h1>
        <p className="mt-2 text-text-secondary">Welcome, {user?.name ?? user?.email}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/account/orders"
            className="rounded-lg border border-gray-200 p-6 hover:border-primary-light hover:shadow-sm transition-all"
          >
            <h2 className="font-semibold text-primary">Order History</h2>
            <p className="mt-1 text-sm text-text-secondary">View your past orders</p>
          </Link>
        </div>
      </div>
    </>
  );
}
