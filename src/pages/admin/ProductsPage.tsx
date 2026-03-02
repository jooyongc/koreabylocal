import { useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import {
  ProductListToolbar,
  ProductListTable,
  BulkActionBar,
} from "@/components/admin/products";
import Pagination from "@/components/product/Pagination";
import { Skeleton } from "@/components/common/Skeleton";
import { useAdminProductList } from "@/hooks/useAdminProductList";

export default function ProductsPage() {
  const {
    data,
    isLoading,
    search,
    status,
    categoryId,
    page,
    setFilter,
  } = useAdminProductList();

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const toggle = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (!data?.products) return;
    setSelectedIds((prev) => {
      const allSelected = data.products.every((p) => prev.has(p.id));
      if (allSelected) return new Set();
      return new Set(data.products.map((p) => p.id));
    });
  }, [data?.products]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  return (
    <>
      <Helmet>
        <title>Product Management | Korea By Local Admin</title>
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary">Products</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage all products in the shop.
          </p>
        </div>

        <div className="space-y-4">
          <ProductListToolbar
            search={search}
            status={status}
            categoryId={categoryId}
            onFilterChange={setFilter}
          />

          <BulkActionBar selectedIds={selectedIds} onClear={clearSelection} />

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              <ProductListTable
                products={data?.products ?? []}
                selectedIds={selectedIds}
                onToggle={toggle}
                onToggleAll={toggleAll}
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
