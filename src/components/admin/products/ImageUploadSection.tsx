import { useState, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Upload, X, Star } from "lucide-react";
import { uploadImage } from "@/lib/uploadImage";
import type { ProductFormData } from "@/types/admin";
import toast from "react-hot-toast";

function SortableImage({
  url,
  index,
  onRemove,
}: {
  url: string;
  index: number;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200"
    >
      <img
        src={url}
        alt={`Product ${index + 1}`}
        loading="lazy"
        className="h-full w-full object-cover"
        {...attributes}
        {...listeners}
      />
      {index === 0 && (
        <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded bg-yellow-400 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          <Star className="h-3 w-3" />
          Thumbnail
        </span>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function ImageUploadSection() {
  const { watch, setValue } = useFormContext<ProductFormData>();
  const images = watch("images") ?? [];
  const [uploading, setUploading] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      setUploading(true);
      try {
        const urls: string[] = [];
        for (const file of Array.from(files)) {
          const url = await uploadImage(file);
          urls.push(url);
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
    [images, setValue]
  );

  const removeImage = (index: number) => {
    const next = images.filter((_, i) => i !== index);
    setValue("images", next);
    setValue("thumbnail_url", next[0] ?? "");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = images.indexOf(active.id as string);
    const newIndex = images.indexOf(over.id as string);
    const next = arrayMove(images, oldIndex, newIndex);
    setValue("images", next);
    setValue("thumbnail_url", next[0] ?? "");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-primary">Images</h2>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="mb-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 transition-colors hover:border-primary/50"
      >
        <Upload className="mb-2 h-8 w-8 text-gray-400" />
        <p className="mb-1 text-sm text-gray-500">
          {uploading ? "Uploading..." : "Drop images here or click to upload"}
        </p>
        <p className="text-xs text-gray-400">Max 5MB per file</p>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFiles(e.target.files)}
          className="absolute inset-0 cursor-pointer opacity-0"
          style={{ position: "relative" }}
          disabled={uploading}
        />
      </div>

      {images.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {images.map((url, i) => (
                <SortableImage
                  key={url}
                  url={url}
                  index={i}
                  onRemove={() => removeImage(i)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}
