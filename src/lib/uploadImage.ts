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
