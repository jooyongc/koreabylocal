import { Plus, Trash2 } from "lucide-react";
import type { OptionValueFormData } from "@/types/admin";

interface Props {
  values: OptionValueFormData[];
  onChange: (values: OptionValueFormData[]) => void;
}

export default function OptionValuesEditor({ values, onChange }: Props) {
  const addValue = () => {
    onChange([...values, { label: "", price_modifier: 0 }]);
  };

  const removeValue = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const updateValue = (index: number, field: keyof OptionValueFormData, val: string | number) => {
    const next = [...values];
    next[index] = { ...next[index], [field]: val };
    onChange(next);
  };

  return (
    <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
      <p className="text-xs font-medium text-gray-500">Option Values</p>
      {values.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={v.label}
            onChange={(e) => updateValue(i, "label", e.target.value)}
            placeholder="Label"
            className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
          />
          <input
            type="number"
            value={v.price_modifier}
            onChange={(e) => updateValue(i, "price_modifier", Number(e.target.value))}
            placeholder="+0"
            className="w-24 rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={() => removeValue(i)}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addValue}
        className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Value
      </button>
    </div>
  );
}
