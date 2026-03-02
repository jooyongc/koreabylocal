import { Search, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useCategories } from "@/hooks/useCategories";

interface Props {
  search: string;
  status: string;
  categoryId: string;
  onFilterChange: (key: string, value: string) => void;
}

export default function ProductListToolbar({
  search,
  status,
  categoryId,
  onFilterChange,
}: Props) {
  const { data: categories } = useCategories();
  const childCategories = categories?.filter((c) => c.parent_id) ?? [];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <select
          value={status}
          onChange={(e) => onFilterChange("status", e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="hidden">Hidden</option>
          <option value="sold_out">Sold Out</option>
        </select>

        <select
          value={categoryId}
          onChange={(e) => onFilterChange("category", e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">All Categories</option>
          {childCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <Link
        to="/admin/products/new"
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" />
        Add Product
      </Link>
    </div>
  );
}
