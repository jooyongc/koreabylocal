import { Helmet } from "react-helmet-async";

export default function DashboardPage() {
  return (
    <>
      <Helmet>
        <title>Admin Dashboard | Korea By Local</title>
      </Helmet>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
        <p className="mt-2 text-text-secondary">Overview of your site's activity.</p>
      </div>
    </>
  );
}
