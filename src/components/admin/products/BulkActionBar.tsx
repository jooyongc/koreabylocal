import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { useBulkUpdateStatus, useDeleteProducts } from "@/hooks/useProductMutation";
import type { ProductStatus } from "@/types";
import toast from "react-hot-toast";

interface Props {
  selectedIds: Set<number>;
  onClear: () => void;
}

export default function BulkActionBar({ selectedIds, onClear }: Props) {
  const [statusValue, setStatusValue] = useState("");
  const bulkStatus = useBulkUpdateStatus();
  const deleteMutation = useDeleteProducts();
  const count = selectedIds.size;

  if (count === 0) return null;

  const ids = [...selectedIds];

  const handleStatusChange = async () => {
    if (!statusValue) return;
    try {
      await bulkStatus.mutateAsync({ ids, status: statusValue as ProductStatus });
      toast.success(`Updated ${count} products`);
      onClear();
      setStatusValue("");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${count} products? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync(ids);
      toast.success(`Deleted ${count} products`);
      onClear();
    } catch {
      toast.error("Failed to delete products");
    }
  };

  const isLoading = bulkStatus.isPending || deleteMutation.isPending;

  return (
    <div className="flex items-center gap-3 rounded-lg bg-primary/5 px-4 py-3">
      <span className="text-sm font-medium text-primary">
        {count} selected
      </span>

      <div className="flex items-center gap-2">
        <select
          value={statusValue}
          onChange={(e) => setStatusValue(e.target.value)}
          className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">Change status...</option>
          <option value="active">Active</option>
          <option value="hidden">Hidden</option>
          <option value="sold_out">Sold Out</option>
        </select>
        {statusValue && (
          <button
            onClick={handleStatusChange}
            disabled={isLoading}
            className="rounded bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
          </button>
        )}
      </div>

      <button
        onClick={handleDelete}
        disabled={isLoading}
        className="ml-auto flex items-center gap-1 rounded px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </button>
    </div>
  );
}
