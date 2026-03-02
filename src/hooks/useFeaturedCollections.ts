import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { FeaturedCollection } from "@/types";

export function useFeaturedCollections() {
  return useQuery<FeaturedCollection[]>({
    queryKey: ["featured-collections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("featured_collections")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
