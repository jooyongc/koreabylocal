import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { BlogForm } from "@/components/admin/blog";

export default function BlogNewPage() {
  return (
    <>
      <Helmet>
        <title>New Blog Post | Korea By Local Admin</title>
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
        <div className="mb-6">
          <Link
            to="/admin/blog"
            className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>
          <h1 className="text-2xl font-bold text-primary">New Blog Post</h1>
        </div>

        <BlogForm mode="create" />
      </div>
    </>
  );
}
