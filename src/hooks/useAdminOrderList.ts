import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { Order } from "@/types";

export type AdminOrderRow = Order & {
  profiles: { name: string | null; email: string } | null;
  order_items: { product_title: string }[];
};

const PAGE_SIZE = 20;

export function useAdminOrderList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const dateFrom = searchParams.get("from") ?? "";
  const dateTo = searchParams.get("to") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const query = useQuery({
    queryKey: ["admin-orders", { search, status, dateFrom, dateTo, page }],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let q = supabase
        .from("orders")
        .select(
          "*, profiles(name, email), order_items(product_title)",
          { count: "exact" }
        )
        .order("created_at", { ascending: false });

      if (status) q = q.eq("status", status);
      if (dateFrom) q = q.gte("created_at", `${dateFrom}T00:00:00`);
      if (dateTo) q = q.lte("created_at", `${dateTo}T23:59:59`);

      if (search) {
        q = q.or(
          `order_number.ilike.%${search}%,guest_name.ilike.%${search}%,guest_email.ilike.%${search}%`
        );
      }

      const from = (page - 1) * PAGE_SIZE;
      q = q.range(from, from + PAGE_SIZE - 1);

      const { data, count, error } = await q;
      if (error) throw error;

      return {
        orders: (data ?? []) as unknown as AdminOrderRow[],
        totalCount: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
      };
    },
  });

  const setFilter = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      if (key !== "page") next.delete("page");
      return next;
    });
  };

  return {
    ...query,
    search,
    status,
    dateFrom,
    dateTo,
    page,
    setFilter,
  };
}
