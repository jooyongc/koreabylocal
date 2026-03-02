import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Package, ChevronRight, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";
import { Skeleton } from "@/components/common/Skeleton";
import type { Order } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function OrdersPage() {
  const user = useAuthStore((s) => s.user);

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["my-orders", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as Order[];
    },
  });

  return (
    <>
      <Helmet>
        <title>My Orders | Korea By Local</title>
        <meta
          name="description"
          content="View your order history and track current orders."
        />
      </Helmet>

      <div className="mx-auto max-w-3xl px-4 py-8 lg:py-12">
        <Link
          to="/account"
          className="mb-4 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          My Account
        </Link>

        <h1 className="text-2xl font-bold text-primary lg:text-3xl">
          My Orders
        </h1>

        <div className="mt-8">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-gray-200 p-5"
                >
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  to={`/account/orders/${order.id}`}
                  className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-primary-light hover:shadow-sm"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-primary">
                        {order.order_number}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-text-secondary">
                      <time>
                        {format(
                          new Date(order.created_at),
                          "MMM d, yyyy"
                        )}
                      </time>
                      <span>{formatPrice(order.total_amount)}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-text-secondary transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-background-gray">
                <Package className="h-8 w-8 text-text-secondary/40" />
              </div>
              <p className="text-lg font-medium text-primary">
                No orders yet
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Your order history will appear here.
              </p>
              <Link
                to="/shop"
                className="mt-6 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
              >
                Start Shopping
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
