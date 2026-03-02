import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/types";

export function useRelatedProducts(
  categoryId: number | null | undefined,
  currentProductId: number | undefined,
  limit = 8,
) {
  return useQuery<Product[]>({
    queryKey: ["related-products", categoryId, currentProductId, limit],
    enabled: !!categoryId && !!currentProductId,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("category_id", categoryId!)
        .neq("id", currentProductId!)
        .eq("status", "active")
        .order("sort_order")
        .limit(limit);

      return data ?? [];
    },
  });
}
