import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import { format } from "date-fns";
import type { BlogPost } from "@/types";

const CATEGORY_COLORS: Record<string, string> = {
  NEWS: "bg-blue-100 text-blue-700",
  LOCALS: "bg-emerald-100 text-emerald-700",
  KOREAN: "bg-orange-100 text-orange-700",
  "K-CULTURE": "bg-purple-100 text-purple-700",
};

function formatViews(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
}

export default function BlogListCard({ post }: { post: BlogPost }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group block overflow-hidden rounded-xl border border-gray-100 bg-white transition-shadow hover:shadow-lg"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] overflow-hidden bg-background-gray">
        {post.thumbnail_url ? (
          <img
            src={post.thumbnail_url}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-text-secondary/40">
            <svg
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
          </div>
        )}

        {/* Category badge */}
        <span
          className={`absolute left-2 top-2 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${CATEGORY_COLORS[post.category] ?? "bg-gray-100 text-gray-700"}`}
        >
          {post.category}
        </span>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-primary transition-colors group-hover:text-primary-light">
          {post.title}
        </h3>

        <div className="mt-3 flex items-center gap-3 text-xs text-text-secondary">
          {post.author && <span>{post.author}</span>}
          {post.published_at && (
            <time>{format(new Date(post.published_at), "MMM d, yyyy")}</time>
          )}
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {formatViews(post.view_count)}
          </span>
        </div>
      </div>
    </Link>
  );
}
