import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronRight, Download, Search } from "lucide-react";
import { download, toCsv } from "./format";

export interface Column<T> {
  key: string;
  label: string;
  /** Sort and export value. */
  value: (r: T) => string | number;
  render?: (r: T) => ReactNode;
  align?: "left" | "right";
  hint?: string;
  className?: string;
}

/**
 * Every chart's table twin: sortable columns, a search box, CSV export, and a
 * row click that opens the drill-down.
 */
export function DataTable<T>({ rows, columns, defaultSort, search, filename, onRowClick, pageSize = 12, empty = "No data in this period.", toolbar }: {
  rows: T[];
  columns: Array<Column<T>>;
  defaultSort: { key: string; desc: boolean };
  search?: (r: T) => string;
  filename: string;
  onRowClick?: (r: T) => void;
  pageSize?: number;
  empty?: ReactNode;
  toolbar?: ReactNode;
}) {
  const [sort, setSort] = useState(defaultSort);
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(pageSize);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const col = columns.find((c) => c.key === sort.key) ?? columns[0];
    return rows
      .filter((r) => !needle || (search?.(r) ?? "").toLowerCase().includes(needle))
      .sort((a, b) => {
        const va = col.value(a), vb = col.value(b);
        const d = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
        return sort.desc ? -d : d;
      });
  }, [rows, columns, sort, q, search]);

  const exportCsv = () =>
    download(
      `${filename}.csv`,
      toCsv(filtered as Array<Record<string, unknown>>, columns.map((c) => ({ key: c.key, label: c.label, value: c.value as (r: never) => unknown }))),
    );

  return (
    <div>
      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        {search && (
          <label className="relative min-w-[160px] flex-1 sm:max-w-[260px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" aria-hidden />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setLimit(pageSize); }}
              placeholder="Filter…"
              aria-label="Filter rows"
              className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-2 text-[12px] focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </label>
        )}
        {toolbar}
        <span className="ml-auto text-[11px] text-gray-400">{filtered.length.toLocaleString("en-US")} rows</span>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-50"
          title="Download these rows as CSV"
        >
          <Download className="h-3 w-3" aria-hidden /> CSV
        </button>
      </div>

      <div className="-mx-1 overflow-x-auto">
        <table className="w-full min-w-[560px] text-[12px]">
          <thead>
            <tr className="border-b border-gray-200">
              {columns.map((c) => {
                const active = sort.key === c.key;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={active ? (sort.desc ? "descending" : "ascending") : "none"}
                    className={`whitespace-nowrap px-2 py-2 font-medium text-gray-500 ${c.align === "right" ? "text-right" : "text-left"} ${c.className ?? ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => setSort((s) => ({ key: c.key, desc: s.key === c.key ? !s.desc : c.align === "right" }))}
                      className={`inline-flex items-center gap-0.5 hover:text-gray-900 ${active ? "text-gray-900" : ""}`}
                      title={c.hint}
                    >
                      {c.label}
                      {active && (sort.desc ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
                    </button>
                  </th>
                );
              })}
              {onRowClick && <th className="w-6" aria-hidden />}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={columns.length + 1} className="py-6 text-center text-gray-400">{empty}</td></tr>
            ) : filtered.slice(0, limit).map((r, i) => (
              <tr
                key={i}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
                onKeyDown={onRowClick ? (e) => { if (e.key === "Enter") onRowClick(r); } : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                className={`group border-b border-gray-100 last:border-0 ${onRowClick ? "cursor-pointer hover:bg-indigo-50/40 focus-visible:bg-indigo-50/60 focus-visible:outline-none" : ""}`}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`px-2 py-2 ${c.align === "right" ? "ga-tabular text-right" : "text-left"} ${c.className ?? ""}`}>
                    {c.render ? c.render(r) : c.value(r)}
                  </td>
                ))}
                {onRowClick && <td className="pr-1 text-gray-300 group-hover:text-primary"><ChevronRight className="h-3.5 w-3.5" /></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length > limit && (
        <button type="button" onClick={() => setLimit((l) => l + 25)} className="mt-2 text-[11.5px] font-medium text-primary/70 hover:text-primary">
          Show {Math.min(25, filtered.length - limit)} more of {filtered.length - limit}
        </button>
      )}
    </div>
  );
}
