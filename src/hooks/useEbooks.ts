import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";

export type EbookRow = Tables<"ebooks">;

// Columns safe to expose to anonymous visitors. `file_url` is the private
// storage path for the paid download — it must only ever be read server-side
// (by the download-ebook edge function, using the service role), never
// returned from a public query, or anyone could skip payment entirely.
const PUBLIC_COLUMNS =
  "id, slug, title, description, cover_image_url, preview_images, price_usd, price_jpy, is_active, created_at";

export type PublicEbook = Omit<EbookRow, "file_url" | "download_count">;

export function useEbooks() {
  return useQuery({
    queryKey: ["ebooks"],
    queryFn: async (): Promise<PublicEbook[]> => {
      const { data, error } = await supabase
        .from("ebooks")
        .select(PUBLIC_COLUMNS)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as PublicEbook[]) ?? [];
    },
  });
}
