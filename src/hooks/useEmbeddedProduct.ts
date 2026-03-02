import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/types";

export function useEmbeddedProduct(productId: number) {
  return useQuery<Product | null>({
    queryKey: ["embedded-product", productId],
    enabled: productId > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (error || !data) return null;
      return data as Product;
    },
  });
}
