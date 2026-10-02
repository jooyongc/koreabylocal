import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";
import { SPOT_CARD_COLUMNS, type SpotRow } from "@/hooks/useSpots";

export type MapSpot = SpotRow &
  Pick<Tables<"experiences">, "region" | "category" | "latitude" | "longitude" | "affiliate_url">;

export const hasCoords = (s: MapSpot): s is MapSpot & { latitude: number; longitude: number } =>
  s.latitude != null && s.longitude != null;

/**
 * Every active spot with what the map and the card need. The whole list is a
 * few dozen rows, so it loads once and filters client-side — the homepage
 * preview and the full map page share the cache.
 */
export function useMapSpots() {
  return useQuery({
    queryKey: ["map-spots"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<MapSpot[]> => {
      const { data, error } = await supabase
        .from("experiences")
        .select(`${SPOT_CARD_COLUMNS}, region, category, latitude, longitude, affiliate_url`)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MapSpot[];
    },
  });
}
