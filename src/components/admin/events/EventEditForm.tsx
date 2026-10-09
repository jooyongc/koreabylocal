import { useState } from "react";
import { useForm } from "react-hook-form";
import { Upload, X, Save, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { uploadImage } from "@/lib/uploadImage";
import { slugify } from "@/lib/slugify";
import { useCreateEvent, useUpdateEvent } from "@/hooks/useEventMutation";
import type { EventFormData } from "@/types/admin";
import type { AdminEventRow } from "@/hooks/useAdminEvents";

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
const labelCls = "mb-1 block text-sm font-medium text-gray-700";

interface Props {
  event?: AdminEventRow;
  onDone: () => void;
}

export default function EventEditForm({ event, onDone }: Props) {
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPreview, setUploadingPreview] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<EventFormData>({
    defaultValues: {
      slug: event?.slug ?? "",
      title: event?.title ?? "",
      subtitle: event?.subtitle ?? "",
      description: event?.description ?? "",
      cover_image_url: event?.cover_image_url ?? "",
      preview_images: event?.preview_images ?? [],
      event_date: event?.event_date ?? "",
      time_label: event?.time_label ?? "",
      location: event?.location ?? "",
      price_usd: event?.price_usd ?? 25,
      price_krw: event?.price_krw ?? null,
      capacity: event?.capacity ?? 20,
      perks: (event?.perks ?? []).join("\n"),
      audience_note: event?.audience_note ?? "",
      is_active: event?.is_active ?? true,
    },
  });

  const title = watch("title");
  const coverImage = watch("cover_image_url");
  const previewImages = watch("preview_images") ?? [];

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

  const onSubmit = async (data: EventFormData) => {
    try {
      if (event) {
        await updateMutation.mutateAsync({ id: event.id, data });
        toast.success("Event updated");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Event created");
      }
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save event");
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
              if (!event) setValue("slug", slugify(e.target.value));
            },
          })}
          className={inputCls}
          placeholder="2026 Global Kimchi Donation"
        />
      </div>

      <div>
        <label className={labelCls}>Slug</label>
        <input {...register("slug", { required: true })} className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Subtitle</label>
        <input {...register("subtitle")} className={inputCls} placeholder="A UNESCO Intangible Cultural Heritage of Humanity" />
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <textarea {...register("description")} rows={4} className={inputCls} placeholder="What this event is, in a few sentences..." />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Event date</label>
          <input type="date" {...register("event_date", { required: true })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Time</label>
          <input {...register("time_label")} className={inputCls} placeholder="10:30–13:30" />
        </div>
      </div>

      <div>
        <label className={labelCls}>Location</label>
        <input {...register("location")} className={inputCls} placeholder="Choroktteul Book Cafe, Dobong-gu, Seoul" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={labelCls}>Price (USD, charged via PayPal)</label>
          <input type="number" step="0.01" {...register("price_usd", { required: true, valueAsNumber: true })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Price (KRW, display only)</label>
          <input
            type="number"
            {...register("price_krw", { setValueAs: (v) => (v === "" ? null : Number(v)) })}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Capacity (ticket limit)</label>
          <input type="number" step="1" min={0} {...register("capacity", { required: true, valueAsNumber: true })} className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>What you'll get (one per line)</label>
        <textarea
          {...register("perks")}
          rows={4}
          className={inputCls}
          placeholder={"Volunteer certificate in English\nLunch: bossam (or tofu) & makgeolli"}
        />
      </div>

      <div>
        <label className={labelCls}>Audience note</label>
        <input {...register("audience_note")} className={inputCls} placeholder="For international residents & visitors in their 20s–30s" />
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
          {event ? "Save changes" : `Create${title ? ` "${title}"` : ""}`}
        </button>
        <button type="button" onClick={onDone} className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  );
}
