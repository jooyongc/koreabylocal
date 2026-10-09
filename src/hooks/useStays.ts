import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { StayRow } from "@/types/stays";

/**
 * Every active hotel card for /where-to-stay. The list stays small (two Reels
 * a day), so it loads once and filters client-side, like useMapSpots.
 * Newest first unless sort_order pins a card higher (lower = earlier).
 */
export function useStays() {
  return useQuery({
    queryKey: ["stays"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<StayRow[]> => {
      const { data, error } = await supabase
        .from("stays")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
