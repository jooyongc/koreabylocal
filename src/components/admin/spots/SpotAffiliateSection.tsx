import { useFormContext } from "react-hook-form";
import type { SpotFormData } from "@/types/admin";

const AFFILIATE_NETWORKS = ["Klook", "Trip.com", "Viator", "GetYourGuide", "KKday"];

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
const labelCls = "mb-1 block text-sm font-medium text-gray-700";

/**
 * Setting a booking link here also makes this spot show up as a paid
 * affiliate card in the homepage's Curated Experiences section
 * (see useAffiliateExperiences — it's the same `experiences` table,
 * filtered to rows that have an affiliate_url), and adds a "what you get" +
 * booking banner to its detail page (SpotDetailPage).
 */
export default function SpotAffiliateSection() {
  const { register } = useFormContext<SpotFormData>();

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-primary">Affiliate Booking</h2>
      <p className="mb-4 text-xs text-gray-400">
        Optional — fill this in if this spot is a bookable tour/activity from a partner. It'll then also appear
        as a Curated Experience card on the homepage, and its detail page will show the highlights/included list
        below with a booking banner instead of plain local-spot info.
      </p>
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Affiliate URL</label>
          <input
            {...register("affiliate_url")}
            className={inputCls}
            placeholder="https://www.klook.com/activity/..."
          />
        </div>
        <div>
          <label className={labelCls}>Affiliate Network</label>
          <input {...register("affiliate_network")} className={inputCls} list="affiliate-networks" placeholder="e.g. Klook" />
          <datalist id="affiliate-networks">
            {AFFILIATE_NETWORKS.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </div>
        <div>
          <label className={labelCls}>Highlights (one per line)</label>
          <textarea
            {...register("highlights")}
            rows={4}
            className={inputCls}
            placeholder={"Hand-carve your own hanji stone seal\nSmall group, max 6 people\nAll materials included"}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>What's included (one per line)</label>
            <textarea
              {...register("included")}
              rows={4}
              className={inputCls}
              placeholder={"Instructor & materials\nLight refreshments"}
            />
          </div>
          <div>
            <label className={labelCls}>What's excluded (one per line)</label>
            <textarea
              {...register("excluded")}
              rows={4}
              className={inputCls}
              placeholder={"Hotel pickup\nPersonal expenses"}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
