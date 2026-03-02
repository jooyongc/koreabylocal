import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface ProductOptionValueRow {
  id: number;
  label: string;
  price_modifier: number;
  sort_order: number;
}

export interface ProductOptionRow {
  id: number;
  name: string;
  is_required: boolean;
  sort_order: number;
  product_option_values: ProductOptionValueRow[];
}

export interface ProductDetail {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  content: string | null;
  price: number;
  compare_price: number | null;
  currency: string;
  status: string;
  badges: string[] | null;
  images: unknown;
  thumbnail_url: string | null;
  view_count: number;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  categories: { id: number; slug: string; name: string } | null;
  product_options: ProductOptionRow[];
}

export function useProduct(slug: string | undefined) {
  return useQuery<ProductDetail | null>({
    queryKey: ["product", slug],
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 min — detail pages change rarely
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          categories(id, slug, name),
          product_options(
            id, name, is_required, sort_order,
            product_option_values(id, label, price_modifier, sort_order)
          )
        `,
        )
        .eq("slug", slug!)
        .single();

      if (error || !data) return null;

      // Sort options and their values by sort_order
      const product = data as unknown as ProductDetail;
      product.product_options = product.product_options
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((opt) => ({
          ...opt,
          product_option_values: opt.product_option_values.sort(
            (a, b) => a.sort_order - b.sort_order,
          ),
        }));

      return product;
    },
  });
}
