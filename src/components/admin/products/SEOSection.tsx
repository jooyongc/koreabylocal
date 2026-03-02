import { useFormContext } from "react-hook-form";
import type { ProductFormData } from "@/types/admin";

export default function SEOSection() {
  const { register, watch } = useFormContext<ProductFormData>();

  const title = watch("title");
  const description = watch("description");
  const seoTitle = watch("seo_title");
  const seoDescription = watch("seo_description");

  const displayTitle = seoTitle || title || "Page Title";
  const displayDesc = seoDescription || description || "Page description will appear here...";

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-primary">SEO</h2>

      <div className="mb-4 rounded-lg bg-gray-50 p-3">
        <p className="text-sm font-medium text-blue-700 line-clamp-1">{displayTitle}</p>
        <p className="mt-1 text-xs text-gray-500 line-clamp-2">{displayDesc}</p>
      </div>

      <div className="space-y-4">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">SEO Title</label>
            <span className="text-xs text-gray-400">{(seoTitle ?? "").length}/60</span>
          </div>
          <input
            {...register("seo_title")}
            maxLength={60}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Defaults to product title"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">SEO Description</label>
            <span className="text-xs text-gray-400">{(seoDescription ?? "").length}/160</span>
          </div>
          <textarea
            {...register("seo_description")}
            rows={3}
            maxLength={160}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Defaults to short description"
          />
        </div>
      </div>
    </section>
  );
}
