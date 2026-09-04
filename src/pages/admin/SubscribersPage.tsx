import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { Search, Download, Users, UserPlus, Loader2 } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import toast from "react-hot-toast";
import Pagination from "@/components/product/Pagination";
import { Skeleton } from "@/components/common/Skeleton";
import { supabase } from "@/lib/supabase";
import { useAdminSubscriberList, type AdminSubscriberRow } from "@/hooks/useAdminSubscriberList";
import { useSetSubscriberStatus } from "@/hooks/useSubscriberMutation";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  unsubscribed: "bg-gray-100 text-gray-500",
  bounced: "bg-red-100 text-red-700",
};

interface SubscriberStats {
  total: number;
  newThisWeek: number;
  bySource: { source: string; count: number }[];
}

function useSubscriberStats() {
  return useQuery<SubscriberStats>({
    queryKey: ["admin-subscriber-stats"],
    staleTime: 30_000,
    queryFn: async () => {
      const weekStart = startOfDay(subDays(new Date(), 7)).toISOString();

      const [totalRes, weekRes, sourceRes] = await Promise.all([
        supabase.from("subscribers").select("id", { count: "exact", head: true }),
        supabase
          .from("subscribers")
          .select("id", { count: "exact", head: true })
          .gte("subscribed_at", weekStart),
        supabase.from("subscribers").select("source"),
      ]);

      const counts = new Map<string, number>();
      for (const row of sourceRes.data ?? []) {
        const key = row.source ?? "unknown";
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      const bySource = Array.from(counts, ([source, count]) => ({ source, count })).sort(
        (a, b) => b.count - a.count,
      );

      return {
        total: totalRes.count ?? 0,
        newThisWeek: weekRes.count ?? 0,
        bySource,
      };
    },
  });
}

async function downloadCsv() {
  const { data, error } = await supabase
    .from("subscribers")
    .select("email, source, lead_magnet, status, subscribed_at")
    .order("subscribed_at", { ascending: false });
  if (error || !data) {
    toast.error("Failed to export subscribers");
    return;
  }

  const header = ["email", "source", "lead_magnet", "status", "subscribed_at"];
  const escape = (v: string | null) => `"${(v ?? "").replace(/"/g, '""')}"`;
  const rows = data.map((s) => [s.email, s.source, s.lead_magnet, s.status, s.subscribed_at].map(escape).join(","));
  const csv = [header.join(","), ...rows].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `subscribers-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function SubscriberTable({ subscribers }: { subscribers: AdminSubscriberRow[] }) {
  const setStatus = useSetSubscriberStatus();

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className="px-4 py-3 font-medium text-gray-500">Email</th>
            <th className="px-4 py-3 font-medium text-gray-500">Source</th>
            <th className="px-4 py-3 font-medium text-gray-500">Lead magnet</th>
            <th className="px-4 py-3 font-medium text-gray-500">Subscribed</th>
            <th className="px-4 py-3 font-medium text-gray-500">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {subscribers.map((s) => (
            <tr key={s.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-primary">{s.email}</td>
              <td className="px-4 py-3 text-gray-600">{s.source ?? "—"}</td>
              <td className="px-4 py-3 text-gray-600">{s.lead_magnet ?? "—"}</td>
              <td className="px-4 py-3 whitespace-nowrap text-gray-400">
                {format(new Date(s.subscribed_at), "yyyy-MM-dd")}
              </td>
              <td className="px-4 py-3">
                <select
                  value={s.status}
                  onChange={(e) =>
                    setStatus.mutate({ id: s.id, status: e.target.value as "active" | "unsubscribed" | "bounced" })
                  }
                  className={`rounded-full border-0 px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s.status] ?? "bg-gray-100 text-gray-500"}`}
                >
                  <option value="active">Active</option>
                  <option value="unsubscribed">Unsubscribed</option>
                  <option value="bounced">Bounced</option>
                </select>
              </td>
            </tr>
          ))}
          {subscribers.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                No subscribers found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function SubscribersPage() {
  const { data, isLoading, search, status, page, setFilter } = useAdminSubscriberList();
  const { data: stats } = useSubscriberStats();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    await downloadCsv();
    setExporting(false);
  };

  return (
    <>
      <Helmet>
        <title>Subscribers | Korea By Local Admin</title>
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Subscribers</h1>
            <p className="mt-1 text-sm text-text-secondary">Newsletter and lead-magnet subscribers.</p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export CSV
          </button>
        </div>

        {/* Stat cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Total subscribers</span>
              <Users className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-bold text-primary">{stats?.total ?? "—"}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">New this week</span>
              <UserPlus className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-primary">{stats?.newThisWeek ?? "—"}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <span className="text-sm text-text-secondary">By source</span>
            <div className="mt-2 space-y-1">
              {(stats?.bySource ?? []).slice(0, 4).map((s) => (
                <div key={s.source} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{s.source}</span>
                  <span className="font-medium text-primary">
                    {stats ? Math.round((s.count / Math.max(stats.total, 1)) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setFilter("search", e.target.value)}
                placeholder="Search by email..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setFilter("status", e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="unsubscribed">Unsubscribed</option>
              <option value="bounced">Bounced</option>
            </select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              <SubscriberTable subscribers={data?.subscribers ?? []} />
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
