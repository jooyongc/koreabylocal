import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { BlogPost } from "@/types";

/** A handful of published posts by slug, in no particular order — used for "related reading" lists. */
export function useBlogPostsBySlugs(slugs: string[]) {
  return useQuery<BlogPost[]>({
    queryKey: ["blog-posts-by-slugs", slugs],
    enabled: slugs.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, slug, title")
        .in("slug", slugs)
        .eq("status", "published");
      if (error) throw error;
      return (data as BlogPost[]) ?? [];
    },
  });
}

export function useBlogPost(slug: string | undefined) {
  return useQuery<BlogPost | null>({
    queryKey: ["blog-post", slug],
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 min — blog posts change rarely
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug!)
        .eq("status", "published")
        .single();

      if (error || !data) return null;
      return data as BlogPost;
    },
  });
}
