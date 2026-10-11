import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus, Sparkles } from "lucide-react";
import { change, fmtChange } from "./format";

export function Card({ title, subtitle, actions, children, className = "", bodyClassName = "" }: {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(18,24,74,0.04)] ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-2 px-5 pt-4">
          <div className="min-w-0">
            {title && <h2 className="text-[13.5px] font-semibold text-primary">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[11.5px] leading-snug text-gray-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
        </header>
      )}
      <div className={`px-5 pb-5 pt-3 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

/**
 * Signed change vs the comparison period. Color = direction × whether up is
 * good, and always with an arrow, so it never relies on color alone.
 */
export function Delta({ cur, prev, lowerIsBetter = false, size = "sm" }: {
  cur: number;
  prev: number | null | undefined;
  lowerIsBetter?: boolean;
  size?: "sm" | "xs";
}) {
  const c = change(cur, prev);
  if (c.kind === "none") return null;
  const text = fmtChange(c);
  const cls = size === "xs" ? "text-[10.5px] px-1 py-px gap-0.5" : "text-[11.5px] px-1.5 py-0.5 gap-0.5";
  if (c.kind === "new") {
    return (
      <span className={`inline-flex items-center rounded-md bg-indigo-50 font-semibold text-indigo-700 ${cls}`} title="Nothing to compare with in the previous period">
        <Sparkles className="h-3 w-3" aria-hidden />new
      </span>
    );
  }
  if (c.kind === "flat") {
    return <span className={`inline-flex items-center rounded-md bg-gray-100 font-semibold text-gray-500 ${cls}`}><Minus className="h-3 w-3" aria-hidden />{text}</span>;
  }
  const up = c.ratio > 0;
  const good = lowerIsBetter ? !up : up;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center rounded-md font-semibold ${cls} ${good ? "bg-emerald-50 text-[#006300]" : "bg-red-50 text-[#b42323]"}`}>
      <Icon className="h-3 w-3" aria-hidden />{text}
    </span>
  );
}

export function Segmented<T extends string | number>({ value, options, onChange, size = "md" }: {
  value: T;
  options: Array<{ value: T; label: ReactNode; title?: string }>;
  onChange: (v: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50/80 p-0.5" role="radiogroup">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          title={o.title}
          onClick={() => onChange(o.value)}
          className={`rounded-md font-medium transition-colors ${size === "sm" ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-[12px]"} ${
            value === o.value ? "bg-white text-primary shadow-sm ring-1 ring-gray-200" : "text-gray-500 hover:text-gray-800"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; hint?: string }) {
  return (
    <label className="inline-flex cursor-pointer select-none items-center gap-2 text-[12px] font-medium text-gray-700" title={hint}>
      <span className="relative inline-flex">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-[18px] w-8 rounded-full bg-gray-300 transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-accent/50" />
        <span className="absolute left-0.5 top-0.5 h-[14px] w-[14px] rounded-full bg-white shadow transition-transform peer-checked:translate-x-3.5" />
      </span>
      {label}
    </label>
  );
}

export function Empty({ children = "No data in this period." }: { children?: ReactNode }) {
  return <p className="py-6 text-center text-[12px] text-gray-400">{children}</p>;
}

/** A small "?" that explains a metric on hover/focus. */
export function Hint({ text }: { text: string }) {
  return (
    <span
      tabIndex={0}
      title={text}
      aria-label={text}
      className="ml-1 inline-flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full border border-gray-300 text-[9px] font-bold text-gray-400 align-middle"
    >
      ?
    </span>
  );
}

/** Line key for tooltips and legends (the mark, never the text, carries the color). */
export function Key({ color, shape = "line" }: { color: string; shape?: "line" | "box" | "dot" }) {
  if (shape === "box") return <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: color }} />;
  if (shape === "dot") return <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />;
  return <span className="inline-block h-[3px] w-3 shrink-0 rounded-full" style={{ background: color }} />;
}

export function Legend({ items, shape = "box" }: { items: Array<{ label: string; color: string }>; shape?: "line" | "box" | "dot" }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-1.5 text-[11.5px] text-gray-600">
          <Key color={it.color} shape={shape} />
          {it.label}
        </li>
      ))}
    </ul>
  );
}
