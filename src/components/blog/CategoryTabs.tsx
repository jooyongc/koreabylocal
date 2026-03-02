import type { BlogCategory } from "@/types";

const TABS: { label: string; value: BlogCategory | undefined }[] = [
  { label: "All", value: undefined },
  { label: "NEWS", value: "NEWS" },
  { label: "LOCALS", value: "LOCALS" },
  { label: "KOREAN", value: "KOREAN" },
  { label: "K-CULTURE", value: "K-CULTURE" },
];

interface CategoryTabsProps {
  active: BlogCategory | undefined;
  onChange: (category: BlogCategory | undefined) => void;
}

export default function CategoryTabs({ active, onChange }: CategoryTabsProps) {
  return (
    <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
      {TABS.map((tab) => (
        <button
          key={tab.label}
          onClick={() => onChange(tab.value)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            active === tab.value
              ? "bg-primary text-white"
              : "bg-white text-text-secondary hover:bg-gray-100"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
