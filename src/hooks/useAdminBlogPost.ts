import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { BlogPost } from "@/types";

export function useAdminBlogPost(id: number | undefined) {
  return useQuery<BlogPost>({
    queryKey: ["admin-blog-post", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as BlogPost;
    },
  });
}
