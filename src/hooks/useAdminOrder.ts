import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Order, OrderItem } from "@/types";

export interface AdminOrderDetail extends Order {
  order_items: OrderItem[];
  profiles: { name: string | null; email: string; phone: string | null } | null;
}

export function useAdminOrder(id: number | undefined) {
  return useQuery<AdminOrderDetail>({
    queryKey: ["admin-order", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*), profiles(name, email, phone)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as unknown as AdminOrderDetail;
    },
  });
}
