import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import PageSEO from "@/components/common/PageSEO";
import { useBlogList, BLOG_PAGE_SIZE } from "@/hooks/useBlogList";
import { CategoryTabs, BlogListCard, BlogListSkeleton } from "@/components/blog";
import Pagination from "@/components/product/Pagination";
import type { BlogCategory } from "@/types";

export default function BlogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const category = (searchParams.get("category") as BlogCategory) || undefined;
  const search = searchParams.get("search") || "";
  const page = Number(searchParams.get("page")) || 1;

  const [searchInput, setSearchInput] = useState(search);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([key, value]) => {
          if (value) {
            next.set(key, value);
          } else {
            next.delete(key);
          }
        });
        // Reset page when filters change (unless page is being explicitly set)
        if (!("page" in updates)) {
          next.delete("page");
        }
        return next;
      });
    },
    [setSearchParams]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        updateParams({ search: searchInput || undefined });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, search, updateParams]);

  const { data, isLoading, isPlaceholderData } = useBlogList({
    category,
    search,
    page,
    pageSize: BLOG_PAGE_SIZE,
  });

  const handleCategoryChange = (cat: BlogCategory | undefined) => {
    updateParams({ category: cat });
  };

  const handlePageChange = (p: number) => {
    updateParams({ page: p > 1 ? String(p) : undefined });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearSearch = () => {
    setSearchInput("");
    updateParams({ search: undefined });
  };

  return (
    <>
      <PageSEO
        title="Blog | Korea By Local"
        description="Read stories, tips, and insights about Korea from local experts. Travel guides, cultural highlights, and hidden gems."
        path="/blog"
      />

      <div className="mx-auto max-w-7xl px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">Blog</h1>
          <p className="mt-2 text-text-secondary">
            Stories and insights from Korean locals.
          </p>
        </div>

        {/* Toolbar: Category tabs + Search */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CategoryTabs active={category} onChange={handleCategoryChange} />

          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search posts..."
              className="w-full rounded-full border border-gray-200 bg-white py-2 pl-9 pr-9 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {searchInput && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className={isPlaceholderData ? "opacity-60 transition-opacity" : ""}>
          {isLoading ? (
            <BlogListSkeleton />
          ) : data && data.posts.length > 0 ? (
            <>
              {/* Results count */}
              <p className="mb-4 text-sm text-text-secondary">
                {data.totalCount} post{data.totalCount !== 1 && "s"}
                {search && (
                  <>
                    {" "}
                    for &ldquo;{search}&rdquo;
                  </>
                )}
              </p>

              {/* Grid */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data.posts.map((post) => (
                  <BlogListCard key={post.id} post={post} />
                ))}
              </div>

              {/* Pagination */}
              <Pagination
                current={page}
                total={data.totalPages}
                onChange={handlePageChange}
              />
            </>
          ) : (
            <div className="py-20 text-center">
              <p className="text-lg text-text-secondary">No posts found.</p>
              {(search || category) && (
                <button
                  onClick={() => {
                    setSearchInput("");
                    setSearchParams({});
                  }}
                  className="mt-4 text-sm font-medium text-accent hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
