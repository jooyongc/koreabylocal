import { useFormContext } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Save, ExternalLink, Loader2 } from "lucide-react";
import type { SpotFormData } from "@/types/admin";

interface Props {
  isSubmitting: boolean;
}

export default function SpotFormActions({ isSubmitting }: Props) {
  const navigate = useNavigate();
  const { watch } = useFormContext<SpotFormData>();
  const slug = watch("slug");

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex flex-col gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSubmitting ? "Saving..." : "Save Spot"}
        </button>

        {slug && (
          <button
            type="button"
            onClick={() => window.open(`/spots/${slug}`, "_blank")}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ExternalLink className="h-4 w-4" />
            Preview
          </button>
        )}

        <button
          type="button"
          onClick={() => navigate("/admin/spots")}
          className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </section>
  );
}
