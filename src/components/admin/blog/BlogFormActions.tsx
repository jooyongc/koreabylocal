import { useFormContext } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Save, ExternalLink, FileText, Loader2 } from "lucide-react";
import type { BlogFormData } from "@/types/admin";

interface Props {
  isSubmitting: boolean;
  onSaveDraft: () => void;
}

export default function BlogFormActions({ isSubmitting, onSaveDraft }: Props) {
  const navigate = useNavigate();
  const { watch } = useFormContext<BlogFormData>();
  const slug = watch("slug");

  const openPreview = () => {
    if (slug) {
      window.open(`/blog/${slug}`, "_blank");
    }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex flex-col gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isSubmitting ? "Publishing..." : "Publish"}
        </button>

        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <FileText className="h-4 w-4" />
          Save as Draft
        </button>

        {slug && (
          <button
            type="button"
            onClick={openPreview}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ExternalLink className="h-4 w-4" />
            Preview
          </button>
        )}

        <button
          type="button"
          onClick={() => navigate("/admin/blog")}
          className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </section>
  );
}
