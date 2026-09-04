import { useForm, FormProvider } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import SpotBasicInfoSection from "./SpotBasicInfoSection";
import RichTextField from "./RichTextField";
import SpotLocationSection from "./SpotLocationSection";
import SpotImagesSection from "./SpotImagesSection";
import SpotRelatedPostsSection from "./SpotRelatedPostsSection";
import SpotFormActions from "./SpotFormActions";
import { useCreateSpot, useUpdateSpot } from "@/hooks/useSpotMutation";
import type { SpotFormData } from "@/types/admin";

interface Props {
  mode: "create" | "edit";
  spotId?: number;
  defaultValues?: Partial<SpotFormData>;
}

const BADGES = ["", "BEST", "HOT", "NEW"];

export default function SpotForm({ mode, spotId, defaultValues }: Props) {
  const navigate = useNavigate();
  const createMutation = useCreateSpot();
  const updateMutation = useUpdateSpot();

  const methods = useForm<SpotFormData>({
    defaultValues: {
      title: "",
      slug: "",
      region: "",
      area: "",
      spot_type: "",
      tagline: "",
      description: "",
      tips: "",
      address: "",
      google_maps_url: "",
      latitude: null,
      longitude: null,
      hours: "",
      price_range: "",
      phone: "",
      website: "",
      instagram: "",
      thumbnail_url: "",
      images: [],
      related_post_slugs: [],
      badge: "",
      editor_pick: false,
      is_active: true,
      sort_order: 0,
      ...defaultValues,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = async (data: SpotFormData) => {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync(data);
        toast.success("Spot created");
        navigate("/admin/spots");
      } else if (spotId) {
        await updateMutation.mutateAsync({ id: spotId, data });
        toast.success("Spot updated");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save spot");
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-6 lg:col-span-2">
            <SpotBasicInfoSection isEdit={mode === "edit"} />
            <RichTextField name="description" label="Why we love it" placeholder="What makes this spot worth visiting..." />
            <RichTextField name="tips" label="Tips from a local" placeholder="Practical tips — how to get there, what to order..." />
            <SpotLocationSection />
            <SpotImagesSection />
            <SpotRelatedPostsSection />
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-primary">Status</h2>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Active (visible on site)</span>
                <input type="checkbox" {...register("is_active")} className="h-5 w-5 rounded accent-primary" />
              </label>
              <label className="mt-3 flex items-center justify-between">
                <span className="text-sm text-gray-700">★ Editor's pick</span>
                <input type="checkbox" {...register("editor_pick")} className="h-5 w-5 rounded accent-primary" />
              </label>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-primary">Badge</h2>
              <select
                {...register("badge")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {BADGES.map((b) => (
                  <option key={b || "none"} value={b}>
                    {b || "None"}
                  </option>
                ))}
              </select>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-primary">Sort Order</h2>
              <input
                type="number"
                {...register("sort_order", { valueAsNumber: true })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="mt-1.5 text-xs text-gray-400">Lower numbers appear first in the spot grid.</p>
            </section>

            <SpotFormActions isSubmitting={isSubmitting} />
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
