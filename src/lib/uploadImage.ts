import { supabase } from "./supabase";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadImage(
  file: File,
  bucket = "product-images"
): Promise<string> {
  if (file.size > MAX_SIZE) {
    throw new Error("File size must be under 5MB");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
