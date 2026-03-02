import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { BlogPost } from "@/types";

interface AdjacentPosts {
  prev: BlogPost | null;
  next: BlogPost | null;
}

export function useAdjacentBlogPosts(
  publishedAt: string | null | undefined,
  postId: number | undefined
) {
  return useQuery<AdjacentPosts>({
    queryKey: ["adjacent-blog-posts", postId],
    enabled: !!publishedAt && !!postId,
    queryFn: async () => {
      const [prevResult, nextResult] = await Promise.all([
        supabase
          .from("blog_posts")
          .select("id, slug, title, thumbnail_url")
          .eq("status", "published")
          .lt("published_at", publishedAt!)
          .order("published_at", { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from("blog_posts")
          .select("id, slug, title, thumbnail_url")
          .eq("status", "published")
          .gt("published_at", publishedAt!)
          .order("published_at", { ascending: true })
          .limit(1)
          .single(),
      ]);

      return {
        prev: prevResult.data as BlogPost | null,
        next: nextResult.data as BlogPost | null,
      };
    },
  });
}
