import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";

export type SpotDetailRow = Tables<"experiences">;

/** Single spot by slug — used by SpotDetailPage. */
export function useSpot(slug: string | undefined) {
  return useQuery({
    queryKey: ["spot", slug],
    enabled: !!slug,
    queryFn: async (): Promise<SpotDetailRow | null> => {
      const { data, error } = await supabase
        .from("experiences")
        .select("*")
        .eq("slug", slug!)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
