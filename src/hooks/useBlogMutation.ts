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
    })
    .eq("id", id);
  if (error) throw error;
}

async function deleteBlogPosts(ids: number[]) {
  const { error } = await supabase.from("blog_posts").delete().in("id", ids);
  if (error) throw error;
}

export function useCreateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBlogPost,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-blog-posts"] }),
  });
}

export function useUpdateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: BlogFormData }) =>
      updateBlogPost(id, data),
    onSuccess: () => {
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
