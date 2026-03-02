import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Json } from "@/types/database";

export function useSiteSettings<T = Json>(key: string) {
  return useQuery<T>({
    queryKey: ["site-settings", key],
    staleTime: 30 * 60 * 1000, // 30 min — site settings rarely change
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", key)
        .single();
      if (error) throw error;
      return data.value as T;
    },
  });
}
