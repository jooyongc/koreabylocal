import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";

export type EbookRow = Tables<"ebooks">;

export function useEbooks() {
  return useQuery({
    queryKey: ["ebooks"],
    queryFn: async (): Promise<EbookRow[]> => {
      const { data, error } = await supabase
        .from("ebooks")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
