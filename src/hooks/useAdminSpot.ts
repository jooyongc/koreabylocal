import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";

export function useAdminSpot(id: number | undefined) {
  return useQuery<Tables<"experiences">>({
    queryKey: ["admin-spot", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}
