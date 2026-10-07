import { supabase } from "./supabase";
import { firstBodyImage } from "./articleImage";
import { renderThumbnail, THUMB_HEIGHT, THUMB_WIDTH } from "./thumbnail";

/**
 * Draws an article's thumbnail over its photo and stores it.
 *
 * The photo is the first image in the article body, so the card shows what the
 * reader then sees on the page — a stock search for the title had picked a
 * Seoul street for an Olive Young guide. Only a body without an image (most of
 * the articles imported from imweb) falls back to a stock photo. Their old
 * thumbnails are never reused: those already have a headline burned in, which
 * would show through the new one.
 */

const BUCKET = "images";

export interface StockImage {
  url: string;
  thumb: string;
  alt: string;
  credit: string;
  source: string;
}

/**
 * Asks the server for a stock photo. The Unsplash and Pexels keys stay in the
 * edge function, so this has to go through it rather than calling them here.
 */
export async function findPhoto(query: string): Promise<StockImage | null> {
  const { data, error } = await supabase.functions.invoke("search-images", {
    body: { query, per_page: 3 },
  });
  if (error || !data?.success) return null;
  const images = (data.images ?? []) as StockImage[];
  return images[0] ?? null;
}

async function uploadThumbnail(blob: Blob, slugOrId: string): Promise<string> {
  const path = `thumbnails/${slugOrId}-${Date.now().toString(36)}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "image/jpeg", upsert: true });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export interface GenerateInput {
  id: number;
  slug: string;
  title: string;
  category: string;
  /** The article body (HTML); its first image becomes the background. */
  content?: string | null;
}

export interface GenerateResult {
  url: string;
  /** Where the background came from, so a bulk run can be audited. */
  photo: string | null;
  credit: string | null;
}

/**
 * Renders and uploads, but does NOT write to the post — the caller decides
 * whether to save, so a bulk tool can show a preview first.
 */
export async function buildThumbnail(post: GenerateInput): Promise<GenerateResult> {
  let photo = firstBodyImage(post.content);
  let credit: string | null = null;

  if (!photo) {
    // Anchored to Korea so a generic title does not return a photo of
    // somewhere else entirely.
    const found = await findPhoto(`${post.title} South Korea`);
    photo = found?.url ?? null;
    credit = found?.credit ?? null;
  }

  const blob = await renderThumbnail({ title: post.title, category: post.category, imageUrl: photo });
  const url = await uploadThumbnail(blob, post.slug || String(post.id));
  return { url, photo, credit };
}

/** Renders a preview without uploading anything. Caller revokes the object URL. */
export async function previewThumbnail(post: GenerateInput): Promise<{ objectUrl: string; photo: string | null }> {
  let photo = firstBodyImage(post.content);
  if (!photo) photo = (await findPhoto(`${post.title} South Korea`))?.url ?? null;
  const blob = await renderThumbnail({ title: post.title, category: post.category, imageUrl: photo });
  return { objectUrl: URL.createObjectURL(blob), photo };
}

export async function saveThumbnail(postId: number, url: string): Promise<void> {
  const { error } = await supabase.from("blog_posts").update({ thumbnail_url: url }).eq("id", postId);
  if (error) throw error;
}

export { THUMB_WIDTH, THUMB_HEIGHT };
