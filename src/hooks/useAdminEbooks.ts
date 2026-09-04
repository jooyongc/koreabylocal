import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";

export type AdminEbookRow = Tables<"ebooks">;

// Admin-authenticated client: the ebooks_read RLS policy lets admins see
// every row (active or not) and every column, including file_url.
export function useAdminEbooks() {
  return useQuery<AdminEbookRow[]>({
    queryKey: ["admin-ebooks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ebooks").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
