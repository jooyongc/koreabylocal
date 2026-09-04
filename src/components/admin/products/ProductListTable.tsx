import { Link } from "react-router-dom";
import { format } from "date-fns";
import type { AdminProductRow } from "@/hooks/useAdminProductList";

const statusBadge: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  hidden: "bg-gray-100 text-gray-600",
  sold_out: "bg-red-100 text-red-700",
};

interface Props {
  products: AdminProductRow[];
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
  onToggleAll: () => void;
}

export default function ProductListTable({
  products,
  selectedIds,
  onToggle,
  onToggleAll,
}: Props) {
  const allSelected = products.length > 0 && products.every((p) => selectedIds.has(p.id));

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className="px-4 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                className="rounded border-gray-300"
              />
            </th>
            <th className="px-4 py-3 font-medium text-gray-500">ID</th>
            <th className="px-4 py-3 font-medium text-gray-500">Image</th>
            <th className="px-4 py-3 font-medium text-gray-500">Product</th>
            <th className="px-4 py-3 font-medium text-gray-500">Price</th>
            <th className="px-4 py-3 font-medium text-gray-500">Status</th>
            <th className="px-4 py-3 font-medium text-gray-500">Category</th>
            <th className="px-4 py-3 font-medium text-gray-500">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(p.id)}
                  onChange={() => onToggle(p.id)}
                  className="rounded border-gray-300"
                />
              </td>
              <td className="px-4 py-3 text-gray-400">#{p.id}</td>
              <td className="px-4 py-3">
                {p.thumbnail_url ? (
                  <img
                    src={p.thumbnail_url}
                    alt={p.title}
                    loading="lazy"
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                    No img
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                <Link
                  to={`/admin/products/${p.id}/edit`}
                  className="font-medium text-primary hover:underline"
                >
                  {p.title}
                </Link>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {p.price.toLocaleString()} KRW
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[p.status] ?? "bg-gray-100 text-gray-500"}`}
                >
                  {p.status}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-500">
                {p.categories?.name ?? "-"}
              </td>
              <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                {format(new Date(p.created_at), "yyyy-MM-dd")}
              </td>
            </tr>
          ))}

          {products.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                No products found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
