import { useState, type CSSProperties, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Delta, Empty } from "../ui";
import { SERIES } from "../format";

export interface BarRow {
  key: string;
  label: ReactNode;
  /** Plain-text label for the title attribute and screen readers. */
  text?: string;
  value: number;
  display: string;
  sub?: ReactNode;
  prev?: number | null;
  lowerIsBetter?: boolean;
  color?: string;
  onClick?: () => void;
}

/**
 * A ranked list with a bar under each row — reads faster than a chart for
 * ranked values. One series, one color; a row may carry its entity's color.
 */
export function BarList({ rows, limit = 8, empty, max }: { rows: BarRow[]; limit?: number; empty?: ReactNode; max?: number }) {
  const [all, setAll] = useState(false);
  if (rows.length === 0) return <Empty>{empty}</Empty>;
  const top = max ?? Math.max(1, ...rows.map((r) => r.value));
  const shown = all ? rows : rows.slice(0, limit);

  return (
    <div>
      <ul className="space-y-2.5">
        {shown.map((r, i) => {
          const body = (
            <>
              <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
                <span className="flex min-w-0 items-center gap-1.5 text-gray-700" title={r.text}>
                  <span className="truncate">{r.label}</span>
                  {r.onClick && <ChevronRight className="h-3 w-3 shrink-0 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />}
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  {r.sub && <span className="text-[11px] text-gray-400">{r.sub}</span>}
                  <span className="ga-tabular font-semibold text-gray-900">{r.display}</span>
                  {r.prev !== undefined && <Delta cur={r.value} prev={r.prev} lowerIsBetter={r.lowerIsBetter} size="xs" />}
                </span>
              </div>
              <div className="mt-1 h-[5px] overflow-hidden rounded-full bg-gray-100">
                <div
                  className="ga-grow-x h-full rounded-full"
                  style={{ width: `${Math.max(0.6, (r.value / top) * 100)}%`, background: r.color ?? SERIES[0], "--i": i } as CSSProperties}
                />
              </div>
            </>
          );
          return (
            <li key={r.key}>
              {r.onClick ? (
                <button type="button" onClick={r.onClick} className="group block w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-accent/40">
                  {body}
                </button>
              ) : body}
            </li>
          );
        })}
      </ul>
      {rows.length > limit && (
        <button type="button" onClick={() => setAll((v) => !v)} className="mt-3 text-[11.5px] font-medium text-primary/70 hover:text-primary">
          {all ? "Show fewer" : `Show all ${rows.length}`}
        </button>
      )}
    </div>
  );
}
