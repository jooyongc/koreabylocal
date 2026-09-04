import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface BlogPostOption {
  slug: string;
  title: string;
}

/** A lightweight slug/title list for pickers (e.g. a spot's related guidebook articles). */
export function useBlogPostOptions() {
  return useQuery<BlogPostOption[]>({
    queryKey: ["blog-post-options"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("slug, title")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
}
