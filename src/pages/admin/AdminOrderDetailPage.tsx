import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useAdminOrder } from "@/hooks/useAdminOrder";
import { OrderStatusActions, AdminNotes } from "@/components/admin/orders";
import type { OrderStatus } from "@/types";

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

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = id ? Number(id) : undefined;
  const { data: order, isLoading, error } = useAdminOrder(orderId);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <p className="text-red-500">Order not found</p>
        <Link to="/admin/orders" className="mt-4 text-sm text-primary hover:underline">
          Back to Orders
        </Link>
      </div>
    );
  }

  const customerName = order.profiles?.name || order.guest_name || "Guest";
  const customerEmail = order.profiles?.email || order.guest_email || "-";
  const customerPhone = order.profiles?.phone || "-";

  return (
    <>
      <Helmet>
        <title>Order {order.order_number} | Korea By Local Admin</title>
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
        <div className="mb-6">
          <Link
            to="/admin/orders"
            className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-primary">{order.order_number}</h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-500"}`}
            >
              {order.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Order Info */}
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-primary">Order Info</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="text-xs text-gray-500">Order Number</span>
                  <p className="text-sm font-medium text-gray-800">{order.order_number}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Date</span>
                  <p className="text-sm font-medium text-gray-800">
                    {format(new Date(order.created_at), "yyyy-MM-dd HH:mm")}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Payment Status</span>
                  <p>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_COLORS[order.payment_status] ?? "bg-gray-100 text-gray-500"}`}
                    >
                      {order.payment_status}
                    </span>
                    {order.payment_method && (
                      <span className="ml-2 text-xs text-gray-400 capitalize">
                        {order.payment_method}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Currency</span>
                  <p className="text-sm font-medium text-gray-800">{order.currency}</p>
                </div>
              </div>
            </section>

            {/* Customer Info */}
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-primary">Customer</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <span className="text-xs text-gray-500">Name</span>
                  <p className="text-sm font-medium text-gray-800">{customerName}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Email</span>
                  <p className="text-sm text-gray-800">{customerEmail}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Phone</span>
                  <p className="text-sm text-gray-800">{customerPhone}</p>
                </div>
              </div>
            </section>

            {/* Order Items */}
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-primary">Items</h2>
              <div className="divide-y divide-gray-100">
                {order.order_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {item.product_title}
                      </p>
                      {item.selected_options && (
                        <p className="mt-0.5 text-xs text-gray-500">
                          {typeof item.selected_options === "string"
                            ? item.selected_options
                            : JSON.stringify(item.selected_options)}
                        </p>
                      )}
                      <p className="mt-0.5 text-xs text-gray-400">
                        ${item.unit_price.toLocaleString()} x {item.quantity}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-gray-800">
                      ${(item.unit_price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-between border-t border-gray-200 pt-4">
                <span className="text-base font-bold text-primary">Total</span>
                <span className="text-base font-bold text-primary">
                  ${order.total_amount.toLocaleString()}
                </span>
              </div>
            </section>

            {/* Customer Note */}
            {order.customer_note && (
              <section className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="mb-2 text-lg font-semibold text-primary">Customer Note</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {order.customer_note}
                </p>
              </section>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <OrderStatusActions
              orderId={order.id}
              currentStatus={order.status as OrderStatus}
            />
            <AdminNotes
              orderId={order.id}
              initialNotes={order.admin_notes ?? ""}
            />
          </div>
        </div>
      </div>
    </>
  );
}
