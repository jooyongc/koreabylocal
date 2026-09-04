import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";

export type AdminSubscriberRow = Tables<"subscribers">;

const PAGE_SIZE = 25;

export function useAdminSubscriberList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const source = searchParams.get("source") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const query = useQuery({
    queryKey: ["admin-subscribers", { search, status, source, page }],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let q = supabase
        .from("subscribers")
        .select("*", { count: "exact" })
        .order("subscribed_at", { ascending: false });

      if (search) q = q.ilike("email", `%${search}%`);
      if (status) q = q.eq("status", status);
      if (source) q = q.eq("source", source);

      const from = (page - 1) * PAGE_SIZE;
      q = q.range(from, from + PAGE_SIZE - 1);

      const { data, count, error } = await q;
      if (error) throw error;

      return {
        subscribers: (data ?? []) as AdminSubscriberRow[],
        totalCount: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
      };
    },
  });

  const setFilter = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== "page") next.delete("page");
      return next;
    });
  };

  return { ...query, search, status, source, page, setFilter };
}
