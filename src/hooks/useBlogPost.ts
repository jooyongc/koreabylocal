import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { BlogPost } from "@/types";

export function useBlogPost(slug: string | undefined) {
  return useQuery<BlogPost | null>({
    queryKey: ["blog-post", slug],
    enabled: !!slug,
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
