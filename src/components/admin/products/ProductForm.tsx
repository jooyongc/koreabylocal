import { useForm, FormProvider } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import BasicInfoSection from "./BasicInfoSection";
import PricingSection from "./PricingSection";
import ImageUploadSection from "./ImageUploadSection";
import ContentEditor from "./ContentEditor";
import OptionsSection from "./OptionsSection";
import FeaturedCollectionsSelect from "./FeaturedCollectionsSelect";
import SEOSection from "./SEOSection";
import ProductFormActions from "./ProductFormActions";
import { useCategories } from "@/hooks/useCategories";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProductMutation";
import type { ProductFormData, OptionGroupFormData } from "@/types/admin";
import type { ProductStatus, ProductBadge } from "@/types";

interface Props {
  mode: "create" | "edit";
  productId?: number;
  defaultValues?: Partial<ProductFormData>;
  existingOptions?: OptionGroupFormData[];
}

const STATUSES: { value: ProductStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "hidden", label: "Hidden" },
  { value: "sold_out", label: "Sold Out" },
];

const BADGES: ProductBadge[] = ["NEW", "BEST", "HOT", "MD", "SALE"];

export default function ProductForm({
  mode,
  productId,
  defaultValues,
  existingOptions = [],
}: Props) {
  const navigate = useNavigate();
  const { data: categories } = useCategories();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const methods = useForm<ProductFormData>({
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      content: "",
      price: 0,
      compare_price: null,
      status: "hidden",
      category_id: null,
      badges: [],
      images: [],
      thumbnail_url: "",
      seo_title: "",
      seo_description: "",
      options: [],
      featured_collection_ids: [],
      ...defaultValues,
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = methods;

  const selectedBadges = watch("badges") ?? [];

  const toggleBadge = (badge: ProductBadge) => {
    const next = selectedBadges.includes(badge)
      ? selectedBadges.filter((b) => b !== badge)
      : [...selectedBadges, badge];
    setValue("badges", next);
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync(data);
        toast.success("Product created");
        navigate("/admin/products");
      } else if (productId) {
        await updateMutation.mutateAsync({
          id: productId,
          data,
          existingOptions,
        });
        toast.success("Product updated");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save product");
    }
  };

  // Group categories into parent/child
  const rootCategories = categories?.filter((c) => !c.parent_id) ?? [];
  const childCategories = categories?.filter((c) => c.parent_id) ?? [];

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-6 lg:col-span-2">
            <BasicInfoSection isEdit={mode === "edit"} />
            <ContentEditor />
            <ImageUploadSection />
            <OptionsSection />
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Status */}
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-primary">Status</h2>
              <select
                {...register("status")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </section>

            <PricingSection />

            {/* Category */}
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-primary">Category</h2>
              <select
                {...register("category_id", { valueAsNumber: true })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select category</option>
                {rootCategories.map((root) => (
                  <optgroup key={root.id} label={root.name}>
                    {childCategories
                      .filter((c) => c.parent_id === root.id)
                      .map((child) => (
                        <option key={child.id} value={child.id}>
                          {child.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </section>

            <FeaturedCollectionsSelect />

            {/* Badges */}
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-primary">Badges</h2>
              <div className="flex flex-wrap gap-2">
                {BADGES.map((badge) => (
                  <button
                    key={badge}
                    type="button"
                    onClick={() => toggleBadge(badge)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedBadges.includes(badge)
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {badge}
                  </button>
                ))}
              </div>
            </section>

            <SEOSection />
            <ProductFormActions isSubmitting={isSubmitting} />
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
