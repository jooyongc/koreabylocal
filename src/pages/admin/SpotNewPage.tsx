import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { SpotForm } from "@/components/admin/spots";

export default function SpotNewPage() {
  return (
    <>
      <Helmet>
        <title>New Spot | Korea By Local Admin</title>
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
        <div className="mb-6">
          <Link to="/admin/spots" className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to Spots
          </Link>
          <h1 className="text-2xl font-bold text-primary">New Spot</h1>
        </div>

        <SpotForm mode="create" />
      </div>
    </>
  );
}
