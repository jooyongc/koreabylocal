import { useFormContext } from "react-hook-form";
import type { ProductFormData } from "@/types/admin";

export default function PricingSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ProductFormData>();

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-primary">Pricing</h2>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Price (KRW) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            {...register("price", {
              required: "Price is required",
              valueAsNumber: true,
              min: { value: 0, message: "Price must be positive" },
            })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="0"
          />
          {errors.price && (
            <p className="mt-1 text-xs text-red-500">{errors.price.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Compare at Price
          </label>
          <input
            type="number"
            {...register("compare_price", { valueAsNumber: true })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Original price before discount"
          />
        </div>
      </div>
    </section>
  );
}
