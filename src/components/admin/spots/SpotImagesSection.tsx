import { useState, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { Upload, X, Star } from "lucide-react";
import toast from "react-hot-toast";
import { uploadImage } from "@/lib/uploadImage";
import type { SpotFormData } from "@/types/admin";

export default function SpotImagesSection() {
  const { watch, setValue } = useFormContext<SpotFormData>();
  const images = watch("images") ?? [];
  const [uploading, setUploading] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      setUploading(true);
      try {
        const urls: string[] = [];
        for (const file of Array.from(files)) {
          urls.push(await uploadImage(file));
        }
        const next = [...images, ...urls];
        setValue("images", next);
        setValue("thumbnail_url", next[0] ?? "");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [images, setValue],
  );

  const removeImage = (index: number) => {
    const next = images.filter((_, i) => i !== index);
    setValue("images", next);
    setValue("thumbnail_url", next[0] ?? "");
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-primary">Photos</h2>

      <label className="mb-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 transition-colors hover:border-primary/50">
        <Upload className="mb-2 h-8 w-8 text-gray-400" />
        <p className="mb-1 text-sm text-gray-500">{uploading ? "Uploading..." : "Click to upload photos"}</p>
        <p className="text-xs text-gray-400">The first photo becomes the thumbnail · Max 5MB per file</p>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={uploading}
        />
      </label>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {images.map((url, i) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200">
              <img src={url} alt={`Spot ${i + 1}`} className="h-full w-full object-cover" />
              {i === 0 && (
                <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded bg-yellow-400 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  <Star className="h-3 w-3" />
                  Thumbnail
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
