import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { DigitalMagazine } from "@/types";

export function useMagazines() {
  return useQuery<DigitalMagazine[]>({
    queryKey: ["magazines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("digital_magazines")
        .select("*")
        .eq("is_active", true)
        .order("issue_date", { ascending: false });
      if (error) throw error;
      return data as DigitalMagazine[];
    },
  });
}
