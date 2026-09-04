import { useState } from "react";
import { useForm } from "react-hook-form";
import { Upload, X, Save, Loader2, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { uploadImage, uploadEbookFile } from "@/lib/uploadImage";
import { slugify } from "@/lib/slugify";
import { useCreateEbook, useUpdateEbook } from "@/hooks/useEbookMutation";
import type { EbookFormData } from "@/types/admin";
import type { AdminEbookRow } from "@/hooks/useAdminEbooks";

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
const labelCls = "mb-1 block text-sm font-medium text-gray-700";

interface Props {
  ebook?: AdminEbookRow;
  onDone: () => void;
}

export default function EbookEditForm({ ebook, onDone }: Props) {
  const createMutation = useCreateEbook();
  const updateMutation = useUpdateEbook();
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPreview, setUploadingPreview] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<EbookFormData>({
    defaultValues: {
      slug: ebook?.slug ?? "",
      title: ebook?.title ?? "",
      description: ebook?.description ?? "",
      cover_image_url: ebook?.cover_image_url ?? "",
      preview_images: ebook?.preview_images ?? [],
      file_url: ebook?.file_url ?? "",
      price_usd: ebook?.price_usd ?? 12.99,
      price_jpy: ebook?.price_jpy ?? null,
      is_active: ebook?.is_active ?? true,
    },
  });

  const title = watch("title");
  const coverImage = watch("cover_image_url");
  const previewImages = watch("preview_images") ?? [];
  const fileUrl = watch("file_url");

  const handleCoverUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      setValue("cover_image_url", await uploadImage(file));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingCover(false);
    }
  };

  const handlePreviewUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploadingPreview(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) urls.push(await uploadImage(file));
      setValue("preview_images", [...previewImages, ...urls]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingPreview(false);
    }
  };

  const handlePdfUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      setValue("file_url", await uploadEbookFile(file));
      toast.success("PDF uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingFile(false);
    }
  };

  const onSubmit = async (data: EbookFormData) => {
    try {
      if (ebook) {
        await updateMutation.mutateAsync({ id: ebook.id, data });
        toast.success("E-book updated");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("E-book created");
      }
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save e-book");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
      <div>
        <label className={labelCls}>Title</label>
        <input
          {...register("title", {
            required: true,
            onChange: (e) => {
              if (!ebook) setValue("slug", slugify(e.target.value));
            },
          })}
          className={inputCls}
          placeholder="The Ultimate Korea Travel Guide"
        />
      </div>

      <div>
        <label className={labelCls}>Slug</label>
        <input {...register("slug", { required: true })} className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <textarea {...register("description")} rows={4} className={inputCls} placeholder="What's inside, in a few sentences..." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Price (USD)</label>
          <input
            type="number"
            step="0.01"
            {...register("price_usd", { required: true, valueAsNumber: true })}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Price (JPY, optional)</label>
          <input
            type="number"
            {...register("price_jpy", { setValueAs: (v) => (v === "" ? null : Number(v)) })}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Cover image</label>
        <div className="flex items-center gap-3">
          {coverImage && <img src={coverImage} alt="" loading="lazy" className="h-16 w-16 rounded-lg object-cover" />}
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            {uploadingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {coverImage ? "Replace" : "Upload"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleCoverUpload(e.target.files)} disabled={uploadingCover} />
          </label>
        </div>
      </div>

      <div>
        <label className={labelCls}>Preview images</label>
        <label className="mb-3 flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
          {uploadingPreview ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Add preview images
          <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handlePreviewUpload(e.target.files)} disabled={uploadingPreview} />
        </label>
        {previewImages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {previewImages.map((url, i) => (
              <div key={url} className="group relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200">
                <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setValue("preview_images", previewImages.filter((_, idx) => idx !== i))}
                  className="absolute right-0.5 top-0.5 rounded-full bg-black/50 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className={labelCls}>PDF file</label>
        <div className="flex items-center gap-3">
          {fileUrl && (
            <span className="flex items-center gap-1.5 text-sm text-gray-600">
              <FileText className="h-4 w-4" /> {fileUrl}
            </span>
          )}
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            {uploadingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {fileUrl ? "Replace PDF" : "Upload PDF"}
            <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handlePdfUpload(e.target.files)} disabled={uploadingFile} />
          </label>
        </div>
        <p className="mt-1.5 text-xs text-gray-400">Stored privately — only ever served through a short-lived signed link.</p>
      </div>

      <label className="flex items-center justify-between">
        <span className="text-sm text-gray-700">Active (visible & purchasable)</span>
        <input type="checkbox" {...register("is_active")} className="h-5 w-5 rounded accent-primary" />
      </label>

      <div className="flex gap-2 border-t border-gray-100 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {ebook ? "Save changes" : `Create${title ? ` "${title}"` : ""}`}
        </button>
        <button type="button" onClick={onDone} className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  );
}
