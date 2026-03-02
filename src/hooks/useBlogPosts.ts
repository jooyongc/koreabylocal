import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { BlogPost } from "@/types";

export function useBlogPosts(category?: string, limit = 8) {
  return useQuery<BlogPost[]>({
    queryKey: ["blog-posts", category ?? "all", limit],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(limit);

      if (category) {
        query = query.eq("category", category);
      }

      const { data } = await query;
      return data ?? [];
    },
  });
}
