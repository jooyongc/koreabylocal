import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, LayoutGrid, List, X } from "lucide-react";
import { useProductList, PAGE_SIZE } from "@/hooks/useProductList";
import ProductCard from "./ProductCard";
import FilterSidebar from "./FilterSidebar";
import Pagination from "./Pagination";

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Most Popular", value: "popular" },
];

interface ProductListPageProps {
  rootCategorySlug: string;
  initialSubcategory?: string;
  title: string;
  description?: string;
}

export default function ProductListPage({
  rootCategorySlug,
  initialSubcategory,
  title,
  description,
}: ProductListPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  /* ─── Read filters from URL ─────────────────────────────── */
  const hasExplicitCategory = searchParams.has("category");
  const activeCategory = hasExplicitCategory
    ? (searchParams.get("category") ?? "")
    : (initialSubcategory ?? "");
  const sort = searchParams.get("sort") ?? "newest";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const activeBadges =
    searchParams.get("badges")?.split(",").filter(Boolean) ?? [];
  const minPrice = searchParams.get("min_price") ?? "";
  const maxPrice = searchParams.get("max_price") ?? "";

  /* ─── Fetch products ────────────────────────────────────── */
  const { data, isLoading, isFetching } = useProductList({
    rootCategory: rootCategorySlug,
    subcategory: activeCategory || undefined,
    badges: activeBadges.length > 0 ? activeBadges : undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sort,
    page,
    pageSize: PAGE_SIZE,
  });

  /* ─── URL update helper ─────────────────────────────────── */
  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    // Reset to page 1 when filters (not page) change
    if (!("page" in updates)) params.delete("page");
    setSearchParams(params, { replace: true });
  };

  /* ─── Filter handlers ───────────────────────────────────── */
  const handleCategoryChange = (slug: string) => {
    if (slug === "" && initialSubcategory) {
      // Explicitly set empty to override initialSubcategory
      updateParams({ category: "" });
    } else if (slug === initialSubcategory && hasExplicitCategory) {
      // Go back to default — remove URL param
      updateParams({ category: undefined });
    } else {
      updateParams({ category: slug || undefined });
    }
  };

  const handleBadgeToggle = (badge: string) => {
    const next = activeBadges.includes(badge)
      ? activeBadges.filter((b) => b !== badge)
      : [...activeBadges, badge];
    updateParams({ badges: next.length > 0 ? next.join(",") : undefined });
  };

  const handlePriceChange = (min: string, max: string) => {
    updateParams({
      min_price: min || undefined,
      max_price: max || undefined,
    });
  };

  const handleSortChange = (value: string) => {
    updateParams({ sort: value === "newest" ? undefined : value });
  };

  const handlePageChange = (p: number) => {
    updateParams({ page: p <= 1 ? undefined : String(p) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    setSearchParams({}, { replace: true });
  };

  /* ─── Shared filter sidebar props ───────────────────────── */
  const sidebarProps = {
    rootCategorySlug,
    activeCategory,
    activeBadges,
    minPrice,
    maxPrice,
    onCategoryChange: handleCategoryChange,
    onBadgeToggle: handleBadgeToggle,
    onPriceChange: handlePriceChange,
    onReset: handleReset,
  };

  const activeFilterCount =
    (activeCategory ? 1 : 0) + activeBadges.length + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary">{title}</h1>
        {description && (
          <p className="mt-1 text-text-secondary">{description}</p>
        )}
      </div>

      {/* ── Toolbar ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <p className="text-sm text-text-secondary">
          {data?.totalCount ?? 0} product{(data?.totalCount ?? 0) !== 1 ? "s" : ""}
          {isFetching && !isLoading && (
            <span className="ml-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
        </p>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary-light"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* View toggle */}
          <div className="hidden items-center gap-0.5 rounded-lg border border-gray-200 p-0.5 sm:flex">
            <button
              onClick={() => setView("grid")}
              className={`rounded-md p-1.5 transition-colors ${
                view === "grid"
                  ? "bg-primary text-white"
                  : "text-text-secondary hover:text-primary"
              }`}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`rounded-md p-1.5 transition-colors ${
                view === "list"
                  ? "bg-primary text-white"
                  : "text-text-secondary hover:text-primary"
              }`}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile filter toggle */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="relative flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-text transition-colors hover:border-primary-light lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────── */}
      <div className="mt-6 flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-24">
            <FilterSidebar {...sidebarProps} />
          </div>
        </aside>

        {/* Product area */}
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <div
              className={
                view === "grid"
                  ? "grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4"
                  : "space-y-3"
              }
            >
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <ProductSkeleton key={i} view={view} />
              ))}
            </div>
          ) : data && data.products.length > 0 ? (
            <>
              <div
                className={
                  view === "grid"
                    ? "grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4"
                    : "space-y-3"
                }
              >
                {data.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    view={view}
                  />
                ))}
              </div>
              <Pagination
                current={page}
                total={data.totalPages}
                onChange={handlePageChange}
              />
            </>
          ) : (
            <div className="flex flex-col items-center py-20 text-center">
              <p className="text-lg text-text-secondary">No products found.</p>
              {activeFilterCount > 0 && (
                <button
                  onClick={handleReset}
                  className="mt-4 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-light"
                >
                  Reset filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile filter drawer ────────────────────────── */}
      {mobileFiltersOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setMobileFiltersOpen(false)}
        />
      )}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] overflow-y-auto bg-white shadow-xl transition-transform duration-300 lg:hidden ${
          mobileFiltersOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <span className="text-lg font-bold text-primary">Filters</span>
          <button
            onClick={() => setMobileFiltersOpen(false)}
            className="p-1 text-text-secondary hover:text-primary transition-colors"
            aria-label="Close filters"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">
          <FilterSidebar {...sidebarProps} />
        </div>
      </div>
    </div>
  );
}

/* ─── Skeleton ────────────────────────────────────────────── */
function ProductSkeleton({ view }: { view: "grid" | "list" }) {
  if (view === "list") {
    return (
      <div className="flex gap-4 rounded-xl border border-gray-100 bg-white p-3">
        <div className="h-28 w-28 shrink-0 animate-pulse rounded-lg bg-gray-200 sm:h-36 sm:w-36" />
        <div className="flex flex-1 flex-col justify-center gap-2">
          <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
          <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
      <div className="aspect-square animate-pulse bg-gray-200" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
        <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}
