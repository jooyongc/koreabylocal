import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { DigitalMagazine } from "@/types";

const PAGE_SIZE = 20;

export function useAdminMagazineList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const query = useQuery({
    queryKey: ["admin-magazines", { search, page }],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let q = supabase
        .from("digital_magazines")
        .select("*", { count: "exact" })
        .order("issue_date", { ascending: false });

      if (search) {
        q = q.ilike("title", `%${search}%`);
      }

      const from = (page - 1) * PAGE_SIZE;
      q = q.range(from, from + PAGE_SIZE - 1);

      const { data, count, error } = await q;
      if (error) throw error;

      return {
        magazines: (data ?? []) as DigitalMagazine[],
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

  return { ...query, search, page, setFilter };
}
