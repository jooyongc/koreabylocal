import { useFormContext } from "react-hook-form";
import { useFeaturedCollections } from "@/hooks/useFeaturedCollections";
import type { ProductFormData } from "@/types/admin";

export default function FeaturedCollectionsSelect() {
  const { watch, setValue } = useFormContext<ProductFormData>();
  const { data: collections, isLoading } = useFeaturedCollections();
  const selected = watch("featured_collection_ids") ?? [];

  const toggle = (id: number) => {
    const next = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id];
    setValue("featured_collection_ids", next);
  };

  if (isLoading) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-primary">Featured Collections</h2>
        <div className="animate-pulse space-y-2">
          <div className="h-5 w-3/4 rounded bg-gray-200" />
          <div className="h-5 w-1/2 rounded bg-gray-200" />
        </div>
      </section>
    );
  }

  if (!collections?.length) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-primary">Featured Collections</h2>
      <div className="max-h-48 space-y-2 overflow-y-auto">
        {collections.map((c) => (
          <label key={c.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(c.id)}
              onChange={() => toggle(c.id)}
              className="rounded border-gray-300"
            />
            <span className="text-gray-700">{c.name}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
