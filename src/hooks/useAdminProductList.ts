import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/types";

export type AdminProductRow = Product & {
  categories: { name: string } | null;
};

const PAGE_SIZE = 20;

export function useAdminProductList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const categoryId = searchParams.get("category") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const query = useQuery({
    queryKey: ["admin-products", { search, status, categoryId, page }],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("*, categories(name)", { count: "exact" })
        .order("created_at", { ascending: false });

      if (search) q = q.ilike("title", `%${search}%`);
      if (status) q = q.eq("status", status);
      if (categoryId) q = q.eq("category_id", Number(categoryId));

      const from = (page - 1) * PAGE_SIZE;
      q = q.range(from, from + PAGE_SIZE - 1);

      const { data, count, error } = await q;
      if (error) throw error;

      return {
        products: (data ?? []) as AdminProductRow[],
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
    categoryId,
    page,
    setFilter,
    pageSize: PAGE_SIZE,
  };
}
