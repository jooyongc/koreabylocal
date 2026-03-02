import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { BlogPost, BlogCategory } from "@/types";

export interface BlogListParams {
  category?: BlogCategory;
  search?: string;
  page: number;
  pageSize: number;
}

export interface BlogListResult {
  posts: BlogPost[];
  totalCount: number;
  totalPages: number;
}

export const BLOG_PAGE_SIZE = 12;

export function useBlogList(params: BlogListParams) {
  return useQuery<BlogListResult>({
    queryKey: ["blog-list", params],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { page, pageSize, category, search } = params;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("blog_posts")
        .select("*", { count: "exact" })
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .range(from, to);

      if (category) {
        query = query.eq("category", category);
      }

      if (search) {
        query = query.or(
          `title.ilike.%${search}%,content.ilike.%${search}%`
        );
      }

      const { data, count, error } = await query;

      if (error) throw error;

      const totalCount = count ?? 0;

      return {
        posts: (data ?? []) as BlogPost[],
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      };
    },
  });
}
