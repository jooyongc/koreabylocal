import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Category } from "@/types";

export function useSubcategories(parentSlug: string) {
  return useQuery<Category[]>({
    queryKey: ["subcategories", parentSlug],
    queryFn: async () => {
      const { data: parent } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", parentSlug)
        .single();

      if (!parent) return [];

      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("parent_id", parent.id)
        .eq("is_active", true)
        .order("sort_order");

      return data ?? [];
    },
  });
}
