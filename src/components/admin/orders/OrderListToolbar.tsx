import { Search } from "lucide-react";

interface Props {
  search: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  onFilterChange: (key: string, value: string) => void;
}

export default function OrderListToolbar({
  search,
  status,
  dateFrom,
  dateTo,
  onFilterChange,
}: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onFilterChange("search", e.target.value)}
          placeholder="Order #, name, or email..."
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <select
        value={status}
        onChange={(e) => onFilterChange("status", e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
      >
        <option value="">All Status</option>
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>

      <div className="flex items-center gap-2">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onFilterChange("from", e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <span className="text-sm text-gray-400">~</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onFilterChange("to", e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>
    </div>
  );
}
