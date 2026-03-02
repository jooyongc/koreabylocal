import { useFormContext, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import OptionValuesEditor from "./OptionValuesEditor";
import type { ProductFormData, OptionType } from "@/types/admin";

const OPTION_TYPES: { value: OptionType; label: string }[] = [
  { value: "select", label: "Select" },
  { value: "date", label: "Date" },
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
];

export default function OptionsSection() {
  const { control, register, watch, setValue } = useFormContext<ProductFormData>();
  const { fields, append, remove } = useFieldArray({ control, name: "options" });

  const addOption = () => {
    append({ name: "", type: "select", is_required: false, values: [] });
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary">Options</h2>
        <button
          type="button"
          onClick={addOption}
          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Option
        </button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-gray-400">No options added yet.</p>
      )}

      <div className="space-y-4">
        {fields.map((field, index) => {
          const type = watch(`options.${index}.type`);
          const values = watch(`options.${index}.values`) ?? [];

          return (
            <div
              key={field.id}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        {...register(`options.${index}.name`)}
                        placeholder="Option name (e.g. Size, Color)"
                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                    <select
                      {...register(`options.${index}.type`)}
                      className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                    >
                      {OPTION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      {...register(`options.${index}.is_required`)}
                      className="rounded border-gray-300"
                    />
                    Required
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {type === "select" && (
                <OptionValuesEditor
                  values={values}
                  onChange={(v) => setValue(`options.${index}.values`, v)}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
