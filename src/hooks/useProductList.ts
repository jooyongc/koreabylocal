import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/types";

export type ProductWithCategory = Product & {
  categories: { slug: string; name: string } | null;
};

export interface ProductListParams {
  rootCategory: string;
  subcategory?: string;
  badges?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort: string;
  page: number;
  pageSize: number;
}

export interface ProductListResult {
  products: ProductWithCategory[];
  totalCount: number;
  totalPages: number;
}

export const PAGE_SIZE = 12;

export function useProductList(params: ProductListParams) {
  return useQuery<ProductListResult>({
    queryKey: ["product-list", params],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const {
        rootCategory,
        subcategory,
        badges,
        minPrice,
        maxPrice,
        sort,
        page,
        pageSize,
      } = params;

      // 1. Resolve root category
      const { data: parent } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", rootCategory)
        .single();

      if (!parent) return { products: [], totalCount: 0, totalPages: 0 };

      // 2. Get child categories
      const { data: children } = await supabase
        .from("categories")
        .select("id, slug")
        .eq("parent_id", parent.id);

      // 3. Determine which category IDs to query
      let categoryIds: number[];
      if (subcategory) {
        const sub = children?.find((c) => c.slug === subcategory);
        categoryIds = sub ? [sub.id] : [parent.id];
      } else {
        categoryIds = [parent.id, ...(children?.map((c) => c.id) ?? [])];
      }

      // 4. Build product query
      let query = supabase
        .from("products")
        .select("*, categories(slug, name)", { count: "exact" })
        .in("category_id", categoryIds)
        .in("status", ["active", "sold_out"]);

      // Badge filter (overlaps = array contains any of)
      if (badges && badges.length > 0) {
        query = query.overlaps("badges", badges);
      }

      // Price filters
      if (minPrice != null) query = query.gte("price", minPrice);
      if (maxPrice != null) query = query.lte("price", maxPrice);

      // Sorting
      switch (sort) {
        case "price_asc":
          query = query.order("price", { ascending: true });
          break;
        case "price_desc":
          query = query.order("price", { ascending: false });
          break;
        case "popular":
          query = query.order("view_count", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, count } = await query;

      return {
        products: (data ?? []) as ProductWithCategory[],
        totalCount: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    },
  });
}
