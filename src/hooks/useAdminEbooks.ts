import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";

export type AdminEbookRow = Tables<"ebooks">;

/**
 * `ebooks.download_count` is never incremented; each purchase row counts its
 * own downloads. The total is summed from those.
 */
export type AdminEbookListRow = AdminEbookRow & { downloads: number; claims: number };

// Admin-authenticated client: the ebooks_read RLS policy lets admins see
// every row (active or not) and every column, including file_url.
export function useAdminEbooks() {
  return useQuery<AdminEbookListRow[]>({
    queryKey: ["admin-ebooks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ebooks")
        .select("*, ebook_purchases(download_count, status)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(({ ebook_purchases, ...ebook }) => {
        const done = ebook_purchases.filter((p) => p.status === "completed");
        return {
          ...ebook,
          downloads: done.reduce((n, p) => n + p.download_count, 0),
          claims: done.length,
        };
      });
    },
  });
}
