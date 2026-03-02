import { Helmet } from "react-helmet-async";
import { BlogListToolbar, BlogListTable } from "@/components/admin/blog";
import Pagination from "@/components/product/Pagination";
import { Skeleton } from "@/components/common/Skeleton";
import { useAdminBlogList } from "@/hooks/useAdminBlogList";
import { useDeleteBlogPosts } from "@/hooks/useBlogMutation";
import toast from "react-hot-toast";

export default function AdminBlogPage() {
  const { data, isLoading, search, category, page, setFilter } =
    useAdminBlogList();
  const deleteMutation = useDeleteBlogPosts();

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync([id]);
      toast.success("Post deleted");
    } catch {
      toast.error("Failed to delete post");
    }
  };

  return (
    <>
      <Helmet>
        <title>Blog Management | Korea By Local Admin</title>
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary">Blog</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage blog posts and articles.
          </p>
        </div>

        <div className="space-y-4">
          <BlogListToolbar
            search={search}
            category={category}
            onFilterChange={setFilter}
          />

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              <BlogListTable
                posts={data?.posts ?? []}
                onDelete={handleDelete}
              />

              {data && data.totalPages > 1 && (
                <Pagination
                  current={page}
                  total={data.totalPages}
                  onChange={(p) => setFilter("page", String(p))}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
