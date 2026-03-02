import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Product, ProductOption, ProductOptionValue } from "@/types";

export interface AdminProductDetail extends Product {
  product_options: (ProductOption & {
    product_option_values: ProductOptionValue[];
  })[];
  featured_collection_products: { collection_id: number }[];
}

export function useAdminProduct(id: number | undefined) {
  return useQuery<AdminProductDetail>({
    queryKey: ["admin-product", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          "*, product_options(*, product_option_values(*)), featured_collection_products(collection_id)"
        )
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as unknown as AdminProductDetail;
    },
  });
}
