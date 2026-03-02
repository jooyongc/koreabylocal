import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  current: number;
  total: number;
  onChange: (page: number) => void;
}

function getVisiblePages(
  current: number,
  total: number,
): (number | "dots")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "dots")[] = [1];

  if (current > 3) pages.push("dots");

  for (
    let i = Math.max(2, current - 1);
    i <= Math.min(total - 1, current + 1);
    i++
  ) {
    pages.push(i);
  }

  if (current < total - 2) pages.push("dots");

  if (total > 1) pages.push(total);

  return pages;
}

const btn =
  "flex h-9 min-w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors";

export default function Pagination({
  current,
  total,
  onChange,
}: PaginationProps) {
  if (total <= 1) return null;

  const pages = getVisiblePages(current, total);

  return (
    <nav
      className="mt-10 flex items-center justify-center gap-1"
      aria-label="Pagination"
    >
      <button
        disabled={current === 1}
        onClick={() => onChange(current - 1)}
        className={`${btn} text-text-secondary hover:bg-background-gray disabled:pointer-events-none disabled:opacity-30`}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((page, i) =>
        page === "dots" ? (
          <span
            key={`dots-${i}`}
            className="flex h-9 min-w-9 items-center justify-center text-sm text-text-secondary"
          >
            &hellip;
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onChange(page)}
            className={`${btn} ${
              current === page
                ? "bg-primary text-white"
                : "text-text hover:bg-background-gray"
            }`}
            aria-current={current === page ? "page" : undefined}
          >
            {page}
          </button>
        ),
      )}

      <button
        disabled={current === total}
        onClick={() => onChange(current + 1)}
        className={`${btn} text-text-secondary hover:bg-background-gray disabled:pointer-events-none disabled:opacity-30`}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
