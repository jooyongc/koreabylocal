import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { OrderStatus } from "@/types";

interface StatusChangeParams {
  orderId: number;
  status: OrderStatus;
  cancelReason?: string;
}

async function updateOrderStatus({ orderId, status, cancelReason }: StatusChangeParams) {
  const updates: Record<string, unknown> = { status };

  if (status === "cancelled" && cancelReason) {
    // Append cancel reason to admin_notes
    const { data: current } = await supabase
      .from("orders")
      .select("admin_notes")
      .eq("id", orderId)
      .single();

    const existing = current?.admin_notes ?? "";
    const timestamp = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
    const note = `[${timestamp}] 취소 사유: ${cancelReason}`;
    updates.admin_notes = existing ? `${existing}\n${note}` : note;
  }

  const { error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId);
  if (error) throw error;

  // Invoke edge function for email notification
  if (status === "confirmed" || status === "cancelled") {
    await supabase.functions.invoke("send-order-status-email", {
      body: { orderId, status, cancelReason },
    }).catch(() => {
      // Email failure should not block status update
    });
  }
}

async function updateAdminNotes(orderId: number, notes: string) {
  const { error } = await supabase
    .from("orders")
    .update({ admin_notes: notes })
    .eq("id", orderId);
  if (error) throw error;
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-order"] });
    },
  });
}

export function useUpdateAdminNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, notes }: { orderId: number; notes: string }) =>
      updateAdminNotes(orderId, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-order"] });
    },
  });
}
