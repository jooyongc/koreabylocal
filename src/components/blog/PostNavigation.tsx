import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BlogPost } from "@/types";

interface PostNavigationProps {
  prev: BlogPost | null;
  next: BlogPost | null;
}

export default function PostNavigation({ prev, next }: PostNavigationProps) {
  if (!prev && !next) return null;

  return (
    <nav className="mt-12 grid gap-4 border-t border-gray-200 pt-8 sm:grid-cols-2">
      {/* Previous */}
      {prev ? (
        <Link
          to={`/guidebook/${prev.slug}`}
          className="group flex items-center gap-3 rounded-xl border border-gray-200 p-4 transition-shadow hover:shadow-md"
        >
          <ChevronLeft className="h-5 w-5 shrink-0 text-text-secondary transition-transform group-hover:-translate-x-1" />
          <div className="min-w-0">
            <span className="text-xs text-text-secondary">Previous</span>
            <p className="line-clamp-1 text-sm font-medium text-primary">
              {prev.title}
            </p>
          </div>
        </Link>
      ) : (
        <div />
      )}

      {/* Next */}
      {next ? (
        <Link
          to={`/guidebook/${next.slug}`}
          className="group flex items-center justify-end gap-3 rounded-xl border border-gray-200 p-4 text-right transition-shadow hover:shadow-md"
        >
          <div className="min-w-0">
            <span className="text-xs text-text-secondary">Next</span>
            <p className="line-clamp-1 text-sm font-medium text-primary">
              {next.title}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-text-secondary transition-transform group-hover:translate-x-1" />
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
