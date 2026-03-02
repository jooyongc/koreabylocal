import type { ProductOptionRow } from "@/hooks/useProduct";

export interface SelectedOptions {
  [optionId: number]: {
    valueId?: number;
    textValue?: string;
    label: string;
    priceModifier: number;
  };
}

interface OptionSelectorProps {
  options: ProductOptionRow[];
  selectedOptions: SelectedOptions;
  onChange: (options: SelectedOptions) => void;
}

function getInputType(optionName: string): string {
  const lower = optionName.toLowerCase();
  if (lower.includes("date") && lower.includes("time")) return "datetime-local";
  if (lower.includes("date")) return "date";
  if (lower.includes("number") || lower.includes("qty") || lower.includes("people"))
    return "number";
  return "text";
}

export default function OptionSelector({
  options,
  selectedOptions,
  onChange,
}: OptionSelectorProps) {
  if (options.length === 0) return null;

  function handleSelectChange(option: ProductOptionRow, valueId: number) {
    const value = option.product_option_values.find((v) => v.id === valueId);
    if (!value) return;
    onChange({
      ...selectedOptions,
      [option.id]: {
        valueId: value.id,
        label: `${option.name}: ${value.label}`,
        priceModifier: value.price_modifier,
      },
    });
  }

  function handleTextChange(option: ProductOptionRow, text: string) {
    onChange({
      ...selectedOptions,
      [option.id]: {
        textValue: text,
        label: `${option.name}: ${text}`,
        priceModifier: 0,
      },
    });
  }

  return (
    <div className="space-y-4">
      {options.map((option) => {
        const hasValues = option.product_option_values.length > 0;

        return (
          <div key={option.id}>
            <label className="mb-1.5 block text-sm font-medium text-primary">
              {option.name}
              {option.is_required && (
                <span className="ml-1 text-red-500">*</span>
              )}
            </label>

            {hasValues ? (
              <select
                value={selectedOptions[option.id]?.valueId ?? ""}
                onChange={(e) =>
                  handleSelectChange(option, Number(e.target.value))
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-primary outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="">Select {option.name}</option>
                {option.product_option_values.map((value) => (
                  <option key={value.id} value={value.id}>
                    {value.label}
                    {value.price_modifier > 0 &&
                      ` (+$${value.price_modifier.toLocaleString()})`}
                    {value.price_modifier < 0 &&
                      ` (-$${Math.abs(value.price_modifier).toLocaleString()})`}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={getInputType(option.name)}
                value={selectedOptions[option.id]?.textValue ?? ""}
                onChange={(e) => handleTextChange(option, e.target.value)}
                placeholder={`Enter ${option.name.toLowerCase()}`}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-primary outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
