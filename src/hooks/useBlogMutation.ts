import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { BlogFormData } from "@/types/admin";

async function createBlogPost(data: BlogFormData) {
  const { data: post, error } = await supabase
    .from("blog_posts")
    .insert({
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || null,
      content: data.content || null,
      category: data.category,
      status: data.status,
      author: data.author || null,
      thumbnail_url: data.thumbnail_url || null,
      published_at: data.status === "published" ? (data.published_at || new Date().toISOString()) : null,
      seo_title: data.seo_title || null,
      seo_description: data.seo_description || null,
      featured: data.featured,
    })
    .select("id")
    .single();
  if (error) throw error;
  return post;
}

async function updateBlogPost(id: number, data: BlogFormData) {
  const { error } = await supabase
    .from("blog_posts")
    .update({
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || null,
      content: data.content || null,
      category: data.category,
      status: data.status,
      author: data.author || null,
      thumbnail_url: data.thumbnail_url || null,
      published_at: data.status === "published" ? (data.published_at || new Date().toISOString()) : null,
      seo_title: data.seo_title || null,
      seo_description: data.seo_description || null,
      featured: data.featured,
    })
    .eq("id", id);
  if (error) throw error;
}

/**
 * Recomputes what to recommend under a post, in the background.
 *
 * Deliberately not awaited and never allowed to throw: a save must not fail, or
 * even feel slow, because a recommendation pass did. A post that publishes
 * without one simply falls back to the category list until the next save or a
 * run of scripts/backfill-related.ts.
 */
function refreshRelated(id: number, status: string) {
  if (status !== "published") return;
  supabase.functions
    .invoke("build-related", { body: { post_id: id } })
    .catch((err) => console.warn("build-related failed:", err instanceof Error ? err.message : err));
}

async function deleteBlogPosts(ids: number[]) {
  const { error } = await supabase.from("blog_posts").delete().in("id", ids);
  if (error) throw error;
}

export function useCreateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBlogPost,
    onSuccess: (post, variables) => {
      refreshRelated(post.id, variables.status);
      qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
    },
  });
}

export function useUpdateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: BlogFormData }) =>
      updateBlogPost(id, data),
    onSuccess: (_result, { id, data }) => {
      refreshRelated(id, data.status);
      qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      qc.invalidateQueries({ queryKey: ["admin-blog-post"] });
    },
  });
}

export function useDeleteBlogPosts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteBlogPosts,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-blog-posts"] }),
  });
}
