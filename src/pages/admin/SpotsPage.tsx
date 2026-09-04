import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Search, Plus, Pencil, Trash2, Star } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import Pagination from "@/components/product/Pagination";
import { Skeleton } from "@/components/common/Skeleton";
import { useAdminSpotList, type AdminSpotRow } from "@/hooks/useAdminSpotList";
import { useRegions } from "@/hooks/useConcepts";
import { useSetSpotActive, useDeleteSpots } from "@/hooks/useSpotMutation";
import { SPOT_TYPES } from "@/data/spotTypes";

function SpotTable({ spots }: { spots: AdminSpotRow[] }) {
  const setActive = useSetSpotActive();
  const deleteSpots = useDeleteSpots();

  const handleDelete = (spot: AdminSpotRow) => {
    if (!window.confirm(`Delete "${spot.title}"? This can't be undone.`)) return;
    deleteSpots.mutate([spot.id], {
      onSuccess: () => toast.success("Spot deleted"),
      onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to delete"),
    });
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className="px-4 py-3 font-medium text-gray-500">Name</th>
            <th className="px-4 py-3 font-medium text-gray-500">Region</th>
            <th className="px-4 py-3 font-medium text-gray-500">Type</th>
            <th className="px-4 py-3 font-medium text-gray-500">Status</th>
            <th className="px-4 py-3 font-medium text-gray-500">Pick</th>
            <th className="px-4 py-3 font-medium text-gray-500">Added</th>
            <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {spots.map((spot) => {
            const typeInfo = SPOT_TYPES.find((t) => t.value === spot.spot_type);
            return (
              <tr key={spot.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {spot.thumbnail_url && (
                      <img src={spot.thumbnail_url} alt="" loading="lazy" className="h-9 w-9 rounded-lg object-cover" />
                    )}
                    <span className="font-medium text-primary">{spot.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{spot.region ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">
                  {typeInfo ? `${typeInfo.emoji} ${typeInfo.label}` : spot.spot_type ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setActive.mutate({ id: spot.id, is_active: !spot.is_active })}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      spot.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {spot.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  {spot.editor_pick && <Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-400">
                  {format(new Date(spot.created_at), "yyyy-MM-dd")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link to={`/admin/spots/${spot.id}/edit`} className="text-gray-500 hover:text-primary" aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button onClick={() => handleDelete(spot)} className="text-gray-500 hover:text-red-500" aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {spots.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                No spots found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function SpotsPage() {
  const { data, isLoading, search, region, spotType, page, setFilter } = useAdminSpotList();
  const { data: regions } = useRegions();

  return (
    <>
      <Helmet>
        <title>Spot Management | Korea By Local Admin</title>
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Spots</h1>
            <p className="mt-1 text-sm text-text-secondary">Manage the curated spot gallery.</p>
          </div>
          <Link
            to="/admin/spots/new"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Spot
          </Link>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setFilter("search", e.target.value)}
                placeholder="Search by name..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <select
              value={region}
              onChange={(e) => setFilter("region", e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">All regions</option>
              {(regions ?? []).map((r) => (
                <option key={r.key} value={r.key}>
                  {r.name}
                </option>
              ))}
            </select>

            <select
              value={spotType}
              onChange={(e) => setFilter("type", e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">All types</option>
              {SPOT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.emoji} {t.label}
                </option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              <SpotTable spots={data?.spots ?? []} />
              {data && data.totalPages > 1 && (
                <Pagination current={page} total={data.totalPages} onChange={(p) => setFilter("page", String(p))} />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
