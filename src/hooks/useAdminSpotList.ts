import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";

export type AdminSpotRow = Tables<"experiences">;

const PAGE_SIZE = 20;

export function useAdminSpotList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const region = searchParams.get("region") ?? "";
  const spotType = searchParams.get("type") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const query = useQuery({
    queryKey: ["admin-spots", { search, region, spotType, page }],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let q = supabase
        .from("experiences")
        .select("*", { count: "exact" })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (search) q = q.ilike("title", `%${search}%`);
      if (region) q = q.eq("region", region);
      if (spotType) q = q.eq("spot_type", spotType);

      const from = (page - 1) * PAGE_SIZE;
      q = q.range(from, from + PAGE_SIZE - 1);

      const { data, count, error } = await q;
      if (error) throw error;

      return {
        spots: (data ?? []) as AdminSpotRow[],
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

  return { ...query, search, region, spotType, page, setFilter };
}
