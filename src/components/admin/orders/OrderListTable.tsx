import { Link } from "react-router-dom";
import { format } from "date-fns";
import type { AdminOrderRow } from "@/hooks/useAdminOrderList";

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

interface Props {
  orders: AdminOrderRow[];
}

function getCustomerName(order: AdminOrderRow): string {
  return order.profiles?.name || order.guest_name || "-";
}

function getCustomerEmail(order: AdminOrderRow): string {
  return order.profiles?.email || order.guest_email || "-";
}

function getProductSummary(order: AdminOrderRow): string {
  const items = order.order_items;
  if (!items?.length) return "-";
  const first = items[0].product_title;
  if (items.length === 1) return first;
  return `${first} +${items.length - 1}`;
}

export default function OrderListTable({ orders }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className="px-4 py-3 font-medium text-gray-500">Order #</th>
            <th className="px-4 py-3 font-medium text-gray-500">Customer</th>
            <th className="px-4 py-3 font-medium text-gray-500">Email</th>
            <th className="px-4 py-3 font-medium text-gray-500">Products</th>
            <th className="px-4 py-3 font-medium text-gray-500">Total</th>
            <th className="px-4 py-3 font-medium text-gray-500">Status</th>
            <th className="px-4 py-3 font-medium text-gray-500">Payment</th>
            <th className="px-4 py-3 font-medium text-gray-500">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <Link
                  to={`/admin/orders/${order.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {order.order_number}
                </Link>
              </td>
              <td className="px-4 py-3 text-gray-700">
                {getCustomerName(order)}
              </td>
              <td className="px-4 py-3 text-gray-500 text-xs">
                {getCustomerEmail(order)}
              </td>
              <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">
                {getProductSummary(order)}
              </td>
              <td className="px-4 py-3 font-medium whitespace-nowrap">
                ${order.total_amount.toLocaleString()}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-500"}`}
                >
                  {order.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_COLORS[order.payment_status] ?? "bg-gray-100 text-gray-500"}`}
                >
                  {order.payment_status}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                {format(new Date(order.created_at), "yyyy-MM-dd HH:mm")}
              </td>
            </tr>
          ))}

          {orders.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                No orders found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
