import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";

// Exactly what SpotCard renders — trimmed from `select("*")` since this backs
// the homepage's main infinite-scroll grid, the highest-traffic query on the site.
export const SPOT_CARD_COLUMNS =
  "id, slug, title, thumbnail_url, images, spot_type, tagline, area, location, price_range";

export type SpotRow = Pick<
  Tables<"experiences">,
  | "id"
  | "slug"
  | "title"
  | "thumbnail_url"
  | "images"
  | "spot_type"
  | "tagline"
  | "area"
  | "location"
  | "price_range"
>;

interface UseSpotsParams {
  area?: string;
  type?: string;
  pageSize?: number;
}

interface SpotsPage {
  rows: SpotRow[];
  nextOffset: number | null;
}

export function useSpots({ area, type, pageSize = 12 }: UseSpotsParams) {
  return useInfiniteQuery({
    queryKey: ["spots", { area, type, pageSize }],
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<SpotsPage> => {
      const from = pageParam * pageSize;
      const to = from + pageSize - 1;
      let q = supabase
        .from("experiences")
        .select(SPOT_CARD_COLUMNS)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .range(from, to);
      if (area) q = q.eq("region", area);
      if (type) q = q.eq("spot_type", type);

      const { data, error } = await q;
      if (error) throw error;
      const rows = (data ?? []) as SpotRow[];
      return { rows, nextOffset: rows.length === pageSize ? pageParam + 1 : null };
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
  });
}
