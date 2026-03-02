import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/types";

export function useProductsByCategory(categorySlug: string, limit = 8) {
  return useQuery<Product[]>({
    queryKey: ["products", "category", categorySlug, limit],
    queryFn: async () => {
      // Get the parent category
      const { data: parent } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", categorySlug)
        .single();

      if (!parent) return [];

      // Include child categories
      const { data: children } = await supabase
        .from("categories")
        .select("id")
        .eq("parent_id", parent.id);

      const ids = [parent.id, ...(children?.map((c) => c.id) ?? [])];

      const { data } = await supabase
        .from("products")
        .select("*")
        .in("category_id", ids)
        .eq("status", "active")
        .order("sort_order")
        .limit(limit);

      return data ?? [];
    },
  });
}
