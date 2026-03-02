import { useFormContext } from "react-hook-form";
import { RefreshCw } from "lucide-react";
import { slugify } from "@/lib/slugify";
import type { ProductFormData } from "@/types/admin";

interface Props {
  isEdit: boolean;
}

export default function BasicInfoSection({ isEdit }: Props) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<ProductFormData>();

  const title = watch("title");

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue("title", val);
    if (!isEdit) {
      setValue("slug", slugify(val));
    }
  };

  const generateSlug = () => {
    setValue("slug", slugify(title ?? ""));
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-primary">Basic Info</h2>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Product Title <span className="text-red-500">*</span>
          </label>
          <input
            {...register("title", { required: "Title is required", onChange: handleTitleChange })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Enter product title"
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Slug</label>
          <div className="flex gap-2">
            <input
              {...register("slug", { required: "Slug is required" })}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="product-url-slug"
            />
            <button
              type="button"
              onClick={generateSlug}
              className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Generate
            </button>
          </div>
          {errors.slug && (
            <p className="mt-1 text-xs text-red-500">{errors.slug.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Short Description
          </label>
          <textarea
            {...register("description")}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Brief product description"
          />
        </div>
      </div>
    </section>
  );
}
