import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";

export type AdminEbookPurchaseRow = Tables<"ebook_purchases">;

export function useAdminEbookPurchases() {
  return useQuery<AdminEbookPurchaseRow[]>({
    queryKey: ["admin-ebook-purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ebook_purchases")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
}
