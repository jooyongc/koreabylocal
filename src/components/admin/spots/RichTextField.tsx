import { useFormContext } from "react-hook-form";
import RichTextEditor from "@/components/admin/common/RichTextEditor";
import type { SpotFormData } from "@/types/admin";

interface Props {
  name: "description" | "tips";
  label: string;
  placeholder?: string;
}

/** A small TipTap field shared by the spot form's "Why we love it" and "Tips from a local" sections. */
export default function RichTextField({ name, label, placeholder }: Props) {
  const { watch, setValue } = useFormContext<SpotFormData>();
  const value = watch(name) ?? "";

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-primary">{label}</h2>
      <RichTextEditor
        value={value}
        onChange={(html) => setValue(name, html)}
        placeholder={placeholder ?? `Write ${label.toLowerCase()}...`}
      />
    </section>
  );
}
