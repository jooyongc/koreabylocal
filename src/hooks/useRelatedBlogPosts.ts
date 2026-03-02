import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { BlogPost } from "@/types";

export function useRelatedBlogPosts(
  category: string | undefined,
  excludeId: number | undefined
) {
  return useQuery<BlogPost[]>({
    queryKey: ["related-blog-posts", category, excludeId],
    enabled: !!category && !!excludeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .eq("category", category!)
        .neq("id", excludeId!)
        .order("published_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return (data ?? []) as BlogPost[];
    },
  });
}
