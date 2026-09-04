import { useFormContext } from "react-hook-form";
import type { SpotFormData } from "@/types/admin";

const PRICE_RANGES = ["$", "$$", "$$$"];

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
const labelCls = "mb-1 block text-sm font-medium text-gray-700";

export default function SpotLocationSection() {
  const { register } = useFormContext<SpotFormData>();

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-primary">Location & Contact</h2>
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Address</label>
          <input {...register("address")} className={inputCls} placeholder="Street address" />
        </div>

        <div>
          <label className={labelCls}>Google Maps URL</label>
          <input {...register("google_maps_url")} className={inputCls} placeholder="https://maps.google.com/..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Latitude</label>
            <input
              type="number"
              step="any"
              {...register("latitude", { setValueAs: (v) => (v === "" ? null : Number(v)) })}
              className={inputCls}
              placeholder="37.5563"
            />
          </div>
          <div>
            <label className={labelCls}>Longitude</label>
            <input
              type="number"
              step="any"
              {...register("longitude", { setValueAs: (v) => (v === "" ? null : Number(v)) })}
              className={inputCls}
              placeholder="126.9236"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Hours</label>
            <input {...register("hours")} className={inputCls} placeholder="e.g. Daily 11am–10pm" />
          </div>
          <div>
            <label className={labelCls}>Price range</label>
            <select {...register("price_range")} className={inputCls}>
              <option value="">Not set</option>
              {PRICE_RANGES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Phone</label>
            <input {...register("phone")} className={inputCls} placeholder="+82 2-1234-5678" />
          </div>
          <div>
            <label className={labelCls}>Website</label>
            <input {...register("website")} className={inputCls} placeholder="https://..." />
          </div>
          <div>
            <label className={labelCls}>Instagram</label>
            <input {...register("instagram")} className={inputCls} placeholder="@handle" />
          </div>
        </div>
      </div>
    </section>
  );
}
