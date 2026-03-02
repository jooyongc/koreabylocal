import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Trash2, Eye } from "lucide-react";
import type { BlogPost } from "@/types";

const statusBadge: Record<string, string> = {
  published: "bg-green-100 text-green-700",
  draft: "bg-yellow-100 text-yellow-700",
};

const categoryColor: Record<string, string> = {
  NEWS: "bg-blue-100 text-blue-700",
  LOCALS: "bg-emerald-100 text-emerald-700",
  KOREAN: "bg-orange-100 text-orange-700",
  "K-CULTURE": "bg-purple-100 text-purple-700",
};

interface Props {
  posts: BlogPost[];
  onDelete: (id: number) => void;
}

export default function BlogListTable({ posts, onDelete }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className="px-4 py-3 font-medium text-gray-500">Title</th>
            <th className="px-4 py-3 font-medium text-gray-500">Category</th>
            <th className="px-4 py-3 font-medium text-gray-500">Status</th>
            <th className="px-4 py-3 font-medium text-gray-500">Views</th>
            <th className="px-4 py-3 font-medium text-gray-500">Date</th>
            <th className="px-4 py-3 font-medium text-gray-500 w-20">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {posts.map((post) => (
            <tr key={post.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {post.thumbnail_url ? (
                    <img
                      src={post.thumbnail_url}
                      alt=""
                      className="h-10 w-14 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded bg-gray-100 text-[10px] text-gray-400">
                      No img
                    </div>
                  )}
                  <Link
                    to={`/admin/blog/${post.id}/edit`}
                    className="font-medium text-primary hover:underline line-clamp-1"
                  >
                    {post.title}
                  </Link>
                </div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${categoryColor[post.category] ?? "bg-gray-100 text-gray-500"}`}
                >
                  {post.category}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[post.status] ?? "bg-gray-100 text-gray-500"}`}
                >
                  {post.status === "published" ? "Published" : "Draft"}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-500">
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {post.view_count.toLocaleString()}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                {format(new Date(post.created_at), "yyyy-MM-dd")}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => {
                    if (window.confirm("Delete this post?")) onDelete(post.id);
                  }}
                  className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}

          {posts.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                No blog posts found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
