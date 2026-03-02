import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { BlogForm } from "@/components/admin/blog";
import { useAdminBlogPost } from "@/hooks/useAdminBlogPost";
import type { BlogFormData } from "@/types/admin";
import type { BlogCategory } from "@/types";

function formatDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function BlogEditPage() {
  const { id } = useParams<{ id: string }>();
  const postId = id ? Number(id) : undefined;
  const { data: post, isLoading, error } = useAdminBlogPost(postId);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <p className="text-red-500">Post not found</p>
        <Link to="/admin/blog" className="mt-4 text-sm text-primary hover:underline">
          Back to Blog
        </Link>
      </div>
    );
  }

  const defaultValues: Partial<BlogFormData> = {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? "",
    content: post.content ?? "",
    category: post.category as BlogCategory,
    status: post.status as BlogFormData["status"],
    author: post.author ?? "",
    thumbnail_url: post.thumbnail_url ?? "",
    published_at: formatDatetimeLocal(post.published_at),
    seo_title: post.seo_title ?? "",
    seo_description: post.seo_description ?? "",
  };

  return (
    <>
      <Helmet>
        <title>Edit: {post.title} | Korea By Local Admin</title>
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
          <h1 className="text-2xl font-bold text-primary">Edit: {post.title}</h1>
        </div>

        <BlogForm mode="edit" postId={postId} defaultValues={defaultValues} />
      </div>
    </>
  );
}
