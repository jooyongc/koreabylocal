import { supabase } from "./supabase";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function uploadImage(
  file: File,
  bucket = "product-images"
): Promise<string> {
  const isImage = file.type.startsWith("image/");
  const limit = isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;
  if (file.size > limit) {
    throw new Error(`File size must be under ${isImage ? "5MB" : "50MB"}`);
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Uploads a paid e-book's PDF into the private `ebooks` bucket and returns
 * its storage path (not a public URL — the bucket isn't public). The
 * download-ebook edge function turns this path into a short-lived signed
 * URL on each valid download request.
 */
export async function uploadEbookFile(file: File): Promise<string> {
  if (file.type !== "application/pdf") {
    throw new Error("Please upload a PDF file");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File must be under 50MB");
  }

  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`;
  const { error } = await supabase.storage.from("ebooks").upload(path, file);
  if (error) throw error;

  return path;
}
