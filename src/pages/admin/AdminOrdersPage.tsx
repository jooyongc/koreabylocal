import { Helmet } from "react-helmet-async";
import { OrderListToolbar, OrderListTable } from "@/components/admin/orders";
import Pagination from "@/components/product/Pagination";
import { Skeleton } from "@/components/common/Skeleton";
import { useAdminOrderList } from "@/hooks/useAdminOrderList";

export default function AdminOrdersPage() {
  const {
    data,
    isLoading,
    search,
    status,
    dateFrom,
    dateTo,
    page,
    setFilter,
  } = useAdminOrderList();

  return (
    <>
      <Helmet>
        <title>Order Management | Korea By Local Admin</title>
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary">Orders</h1>
          <p className="mt-1 text-sm text-text-secondary">
            View and manage customer orders.
          </p>
        </div>

        <div className="space-y-4">
          <OrderListToolbar
            search={search}
            status={status}
            dateFrom={dateFrom}
            dateTo={dateTo}
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
              <OrderListTable orders={data?.orders ?? []} />

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
