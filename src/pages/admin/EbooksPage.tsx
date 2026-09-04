import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Plus, Pencil, Download } from "lucide-react";
import { format } from "date-fns";
import EbookEditForm from "@/components/admin/ebooks/EbookEditForm";
import { Skeleton } from "@/components/common/Skeleton";
import { useAdminEbooks } from "@/hooks/useAdminEbooks";
import { useAdminEbookPurchases } from "@/hooks/useAdminEbookPurchases";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  completed: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-500",
};

const money = (n: number | null) =>
  n == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export default function EbooksPage() {
  const { data: ebooks, isLoading } = useAdminEbooks();
  const { data: purchases, isLoading: purchasesLoading } = useAdminEbookPurchases();
  const [editingId, setEditingId] = useState<number | "new" | null>(null);

  return (
    <>
      <Helmet>
        <title>E-books | Korea By Local Admin</title>
      </Helmet>

      <div className="mx-auto max-w-5xl px-4 py-6 lg:px-6 lg:py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">E-books</h1>
            <p className="mt-1 text-sm text-text-secondary">Manage e-book listings and view purchases.</p>
          </div>
          {editingId === null && (
            <button
              onClick={() => setEditingId("new")}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add E-book
            </button>
          )}
        </div>

        {editingId === "new" && (
          <div className="mb-6">
            <EbookEditForm onDone={() => setEditingId(null)} />
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {(ebooks ?? []).map((ebook) =>
              editingId === ebook.id ? (
                <EbookEditForm key={ebook.id} ebook={ebook} onDone={() => setEditingId(null)} />
              ) : (
                <div key={ebook.id} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5">
                  {ebook.cover_image_url && (
                    <img src={ebook.cover_image_url} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate font-semibold text-primary">{ebook.title}</h2>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          ebook.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {ebook.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-text-secondary">
                      {money(ebook.price_usd)} · {ebook.download_count} downloads
                    </p>
                  </div>
                  <button
                    onClick={() => setEditingId(ebook.id)}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                </div>
              ),
            )}
            {ebooks?.length === 0 && editingId === null && (
              <p className="rounded-xl border border-dashed border-gray-300 py-12 text-center text-gray-400">
                No e-books yet — add one to start selling.
              </p>
            )}
          </div>
        )}

        {/* Purchases */}
        <h2 className="mb-4 mt-10 text-lg font-bold text-primary">Purchases</h2>
        {purchasesLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-500">Buyer</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Amount</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Downloads</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(purchases ?? []).map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-primary">{p.buyer_email}</div>
                      {p.buyer_name && <div className="text-xs text-gray-400">{p.buyer_name}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.amount != null ? `${money(p.amount)} ${p.currency}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <Download className="h-3.5 w-3.5" />
                        {p.download_count} / {p.max_downloads}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-400">
                      {format(new Date(p.created_at), "yyyy-MM-dd HH:mm")}
                    </td>
                  </tr>
                ))}
                {purchases?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                      No purchases yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
