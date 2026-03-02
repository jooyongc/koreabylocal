import { Search, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "NEWS", label: "NEWS" },
  { value: "LOCALS", label: "LOCALS" },
  { value: "KOREAN", label: "KOREAN" },
  { value: "K-CULTURE", label: "K-CULTURE" },
];

interface Props {
  search: string;
  category: string;
  onFilterChange: (key: string, value: string) => void;
}

export default function BlogListToolbar({
  search,
  category,
  onFilterChange,
}: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            placeholder="Search posts..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <select
          value={category}
          onChange={(e) => onFilterChange("category", e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <Link
        to="/admin/blog/new"
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" />
        New Post
      </Link>
    </div>
  );
}
