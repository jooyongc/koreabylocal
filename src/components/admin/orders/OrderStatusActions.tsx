import { useState } from "react";
import { CheckCircle, XCircle, PackageCheck, Loader2 } from "lucide-react";
import { useUpdateOrderStatus } from "@/hooks/useOrderMutation";
import type { OrderStatus } from "@/types";
import toast from "react-hot-toast";

interface Props {
  orderId: number;
  currentStatus: OrderStatus;
}

export default function OrderStatusActions({ orderId, currentStatus }: Props) {
  const mutation = useUpdateOrderStatus();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const handleStatusChange = async (status: OrderStatus, reason?: string) => {
    try {
      await mutation.mutateAsync({ orderId, status, cancelReason: reason });
      const labels: Record<string, string> = {
        confirmed: "Order confirmed",
        completed: "Order completed",
        cancelled: "Order cancelled",
      };
      toast.success(labels[status] ?? "Status updated");
      setShowCancelModal(false);
      setCancelReason("");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const isLoading = mutation.isPending;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-primary">Actions</h2>

      <div className="flex flex-col gap-2">
        {currentStatus === "pending" && (
          <button
            onClick={() => handleStatusChange("confirmed")}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Confirm Order
          </button>
        )}

        {currentStatus === "confirmed" && (
          <button
            onClick={() => handleStatusChange("completed")}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PackageCheck className="h-4 w-4" />
            )}
            Mark as Completed
          </button>
        )}

        {currentStatus !== "cancelled" && currentStatus !== "completed" && (
          <button
            onClick={() => setShowCancelModal(true)}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            Cancel Order
          </button>
        )}

        {(currentStatus === "completed" || currentStatus === "cancelled") && (
          <p className="text-center text-sm text-gray-400">
            This order is {currentStatus}. No further actions available.
          </p>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-red-600">Cancel Order</h3>
            <p className="mb-3 text-sm text-gray-600">
              Please provide a reason for cancellation. This will be recorded and an email will be sent to the customer.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              placeholder="Cancellation reason..."
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Go Back
              </button>
              <button
                onClick={() => handleStatusChange("cancelled", cancelReason)}
                disabled={isLoading || !cancelReason.trim()}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isLoading ? "Cancelling..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
