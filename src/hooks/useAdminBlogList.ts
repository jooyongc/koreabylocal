import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { BlogPost } from "@/types";

const PAGE_SIZE = 20;

// Only what the list table shows: select("*") pulled every article's full HTML
// (~136 KB per page of 20 instead of ~9 KB).
const LIST_COLUMNS = "id, title, slug, category, status, thumbnail_url, view_count, created_at";
export type AdminBlogListRow = Pick<
  BlogPost,
  "id" | "title" | "slug" | "category" | "status" | "thumbnail_url" | "view_count" | "created_at"
>;

export function useAdminBlogList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const query = useQuery({
    queryKey: ["admin-blog-posts", { search, category, page }],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let q = supabase
        .from("blog_posts")
        .select(LIST_COLUMNS, { count: "exact" })
        .order("created_at", { ascending: false });

      if (search) q = q.ilike("title", `%${search}%`);
      if (category) q = q.eq("category", category);

      const from = (page - 1) * PAGE_SIZE;
      q = q.range(from, from + PAGE_SIZE - 1);

      const { data, count, error } = await q;
      if (error) throw error;

      return {
        posts: (data ?? []) as AdminBlogListRow[],
        totalCount: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
      };
    },
  });

  const setFilter = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      if (key !== "page") next.delete("page");
      return next;
    });
  };

  return {
    ...query,
    search,
    category,
    page,
    setFilter,
  };
}
