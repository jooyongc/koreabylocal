import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { format } from "date-fns";
import Pagination from "@/components/product/Pagination";
import { Skeleton } from "@/components/common/Skeleton";
import { useAdminInquiryList } from "@/hooks/useAdminInquiryList";
import type { Inquiry } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  replied: "bg-emerald-100 text-emerald-700",
};

const CATEGORY_COLORS: Record<string, string> = {
  General: "bg-gray-100 text-gray-600",
  "Tour Inquiry": "bg-blue-100 text-blue-700",
  Transportation: "bg-purple-100 text-purple-700",
  "Custom Request": "bg-orange-100 text-orange-700",
  Other: "bg-gray-100 text-gray-600",
};

function InquiryTable({ inquiries }: { inquiries: Inquiry[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className="px-4 py-3 font-medium text-gray-500">Name</th>
            <th className="px-4 py-3 font-medium text-gray-500">Email</th>
            <th className="px-4 py-3 font-medium text-gray-500">Subject</th>
            <th className="px-4 py-3 font-medium text-gray-500">Category</th>
            <th className="px-4 py-3 font-medium text-gray-500">Status</th>
            <th className="px-4 py-3 font-medium text-gray-500">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {inquiries.map((inq) => (
            <tr key={inq.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <Link
                  to={`/admin/inquiries/${inq.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {inq.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-gray-500 text-xs">{inq.email}</td>
              <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">
                {inq.subject || "-"}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[inq.category] ?? "bg-gray-100 text-gray-500"}`}
                >
                  {inq.category}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[inq.status] ?? "bg-gray-100 text-gray-500"}`}
                >
                  {inq.status}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                {format(new Date(inq.created_at), "yyyy-MM-dd HH:mm")}
              </td>
            </tr>
          ))}
          {inquiries.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                No inquiries found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminInquiriesPage() {
  const { data, isLoading, search, status, page, setFilter } =
    useAdminInquiryList();

  return (
    <>
      <Helmet>
        <title>Inquiries | Korea By Local Admin</title>
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary">Inquiries</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage customer inquiries from Ask a Local.
          </p>
        </div>

        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setFilter("search", e.target.value)}
                placeholder="Search by name, email, subject..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <select
              value={status}
              onChange={(e) => setFilter("status", e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="replied">Replied</option>
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
              <InquiryTable inquiries={data?.inquiries ?? []} />

              {data && data.totalPages > 1 && (
                <Pagination
                  current={page}
                  total={data.totalPages}
                  onChange={(p) => setFilter("page", String(p))}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
