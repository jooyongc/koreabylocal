import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useSubcategories } from "@/hooks/useSubcategories";

const BADGE_OPTIONS = ["NEW", "BEST", "HOT", "MD", "SALE"] as const;

const BADGE_STYLES: Record<string, { idle: string; active: string }> = {
  NEW: {
    idle: "border-blue-200 bg-blue-50 text-blue-600",
    active: "border-blue-500 bg-blue-500 text-white",
  },
  BEST: {
    idle: "border-red-200 bg-red-50 text-red-600",
    active: "border-red-500 bg-red-500 text-white",
  },
  HOT: {
    idle: "border-orange-200 bg-orange-50 text-orange-600",
    active: "border-orange-500 bg-orange-500 text-white",
  },
  MD: {
    idle: "border-purple-200 bg-purple-50 text-purple-600",
    active: "border-purple-500 bg-purple-500 text-white",
  },
  SALE: {
    idle: "border-emerald-200 bg-emerald-50 text-emerald-600",
    active: "border-emerald-500 bg-emerald-500 text-white",
  },
};

interface FilterSidebarProps {
  rootCategorySlug: string;
  activeCategory: string;
  activeBadges: string[];
  minPrice: string;
  maxPrice: string;
  onCategoryChange: (slug: string) => void;
  onBadgeToggle: (badge: string) => void;
  onPriceChange: (min: string, max: string) => void;
  onReset: () => void;
}

export default function FilterSidebar({
  rootCategorySlug,
  activeCategory,
  activeBadges,
  minPrice,
  maxPrice,
  onCategoryChange,
  onBadgeToggle,
  onPriceChange,
  onReset,
}: FilterSidebarProps) {
  const { data: subcategories } = useSubcategories(rootCategorySlug);

  // Local price state — apply on blur / Enter for perf
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);

  useEffect(() => setLocalMin(minPrice), [minPrice]);
  useEffect(() => setLocalMax(maxPrice), [maxPrice]);

  const applyPrice = () => {
    if (localMin !== minPrice || localMax !== maxPrice) {
      onPriceChange(localMin, localMax);
    }
  };

  const hasActive =
    activeCategory !== "" || activeBadges.length > 0 || minPrice || maxPrice;

  return (
    <div className="space-y-6">
      {/* Reset */}
      {hasActive && (
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-primary transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Reset all filters
        </button>
      )}

      {/* ── Categories ──────────────────────────────────── */}
      {subcategories && subcategories.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-primary">
            Category
          </legend>
          <div className="space-y-0.5">
            <button
              onClick={() => onCategoryChange("")}
              className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                activeCategory === ""
                  ? "bg-primary font-medium text-white"
                  : "text-text hover:bg-background-gray"
              }`}
            >
              All
            </button>
            {subcategories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => onCategoryChange(cat.slug)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  activeCategory === cat.slug
                    ? "bg-primary font-medium text-white"
                    : "text-text hover:bg-background-gray"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {/* ── Badges ──────────────────────────────────────── */}
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-primary">Badge</legend>
        <div className="flex flex-wrap gap-2">
          {BADGE_OPTIONS.map((badge) => {
            const isActive = activeBadges.includes(badge);
            const styles = BADGE_STYLES[badge];
            return (
              <button
                key={badge}
                onClick={() => onBadgeToggle(badge)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  isActive ? styles.active : styles.idle
                }`}
              >
                {badge}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* ── Price Range ─────────────────────────────────── */}
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-primary">
          Price Range
        </legend>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            placeholder="Min"
            value={localMin}
            onChange={(e) => setLocalMin(e.target.value)}
            onBlur={applyPrice}
            onKeyDown={(e) => e.key === "Enter" && applyPrice()}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-primary-light"
          />
          <span className="shrink-0 text-text-secondary">—</span>
          <input
            type="number"
            min={0}
            placeholder="Max"
            value={localMax}
            onChange={(e) => setLocalMax(e.target.value)}
            onBlur={applyPrice}
            onKeyDown={(e) => e.key === "Enter" && applyPrice()}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-primary-light"
          />
        </div>
      </fieldset>
    </div>
  );
}
