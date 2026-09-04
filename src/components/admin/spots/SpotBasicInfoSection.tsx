import { useFormContext } from "react-hook-form";
import { RefreshCw } from "lucide-react";
import { slugify } from "@/lib/slugify";
import { useRegions } from "@/hooks/useConcepts";
import { SPOT_TYPES } from "@/data/spotTypes";
import type { SpotFormData } from "@/types/admin";

interface Props {
  isEdit: boolean;
}

export default function SpotBasicInfoSection({ isEdit }: Props) {
  const { data: regions } = useRegions();
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<SpotFormData>();

  const title = watch("title");

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue("title", val);
    if (!isEdit) {
      setValue("slug", slugify(val));
    }
  };

  const generateSlug = () => setValue("slug", slugify(title ?? ""));

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-primary">Basic Info</h2>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Spot Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register("title", { required: "Name is required", onChange: handleTitleChange })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="e.g. The vinyl bar that time forgot"
          />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Slug</label>
          <div className="flex gap-2">
            <input
              {...register("slug", { required: "Slug is required" })}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="spot-url-slug"
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
          {errors.slug && <p className="mt-1 text-xs text-red-500">{errors.slug.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Region</label>
            <select
              {...register("region")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select region</option>
              {(regions ?? []).map((r) => (
                <option key={r.key} value={r.key}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Area (neighborhood)</label>
            <input
              {...register("area")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g. hongdae"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
          <select
            {...register("spot_type")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select type</option>
            {SPOT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.emoji} {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Tagline</label>
          <input
            {...register("tagline")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="A one-line hook for the card"
          />
        </div>
      </div>
    </section>
  );
}
