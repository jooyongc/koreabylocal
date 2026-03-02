import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/common/Skeleton";
import type { Order, OrderItem } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const PAYMENT_COLORS: Record<string, string> = {
  unpaid: "bg-yellow-100 text-yellow-700",
  paid: "bg-emerald-100 text-emerald-700",
  refunded: "bg-red-100 text-red-700",
  partial_refund: "bg-orange-100 text-orange-700",
};

function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: order, isLoading } = useQuery<OrderWithItems | null>({
    queryKey: ["order-detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", Number(id))
        .single();

      if (error || !data) return null;
      return data as unknown as OrderWithItems;
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 lg:py-12">
        <Skeleton className="mb-4 h-4 w-24" />
        <Skeleton className="mb-8 h-8 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-primary">Order not found</h1>
        <Link
          to="/account/orders"
          className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Order {order.order_number} | Korea By Local</title>
        <meta
          name="description"
          content="View order details and tracking information."
        />
      </Helmet>

      <div className="mx-auto max-w-3xl px-4 py-8 lg:py-12">
        <Link
          to="/account/orders"
          className="mb-4 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          My Orders
        </Link>

        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-primary lg:text-3xl">
            {order.order_number}
          </h1>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"}`}
          >
            {order.status}
          </span>
        </div>

        {/* Order info */}
        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-text-secondary">
            Order Details
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <span className="text-xs text-text-secondary">Date</span>
              <p className="text-sm font-medium text-primary">
                {format(new Date(order.created_at), "MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
            <div>
              <span className="text-xs text-text-secondary">Payment</span>
              <p className="flex items-center gap-2 text-sm">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${PAYMENT_COLORS[order.payment_status] ?? "bg-gray-100 text-gray-700"}`}
                >
                  {order.payment_status}
                </span>
                {order.payment_method && (
                  <span className="text-text-secondary capitalize">
                    {order.payment_method}
                  </span>
                )}
              </p>
            </div>
            {order.customer_note && (
              <div className="sm:col-span-2">
                <span className="text-xs text-text-secondary">Note</span>
                <p className="text-sm text-primary">{order.customer_note}</p>
              </div>
            )}
          </div>
        </section>

        {/* Order items */}
        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-text-secondary">
            Items
          </h2>
          <div className="divide-y divide-gray-100">
            {order.order_items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-primary">
                    {item.product_title}
                  </p>
                  {item.selected_options && (
                    <p className="mt-0.5 text-xs text-text-secondary">
                      {typeof item.selected_options === "string"
                        ? item.selected_options
                        : JSON.stringify(item.selected_options)}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-text-secondary">
                    {formatPrice(item.unit_price)} x {item.quantity}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-primary">
                  {formatPrice(item.unit_price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 flex justify-between border-t border-gray-200 pt-4">
            <span className="text-base font-bold text-primary">Total</span>
            <span className="text-base font-bold text-primary">
              {formatPrice(order.total_amount)}
            </span>
          </div>
        </section>
      </div>
    </>
  );
}
