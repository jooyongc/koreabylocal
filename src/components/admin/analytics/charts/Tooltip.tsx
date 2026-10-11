import type { ReactNode } from "react";
import { Key } from "../ui";

/**
 * One tooltip box for every chart. It sits beside the pointer and flips to
 * the left in the right half, so it never runs off the card.
 */
export function ChartTooltip({ x, y, width, children }: { x: number; y: number; width: number; children: ReactNode }) {
  const flip = x > width / 2;
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-20 w-max max-w-[260px] rounded-xl border border-gray-200 bg-white/95 px-3 py-2 text-[11.5px] shadow-[0_8px_24px_rgba(18,24,74,0.12)] backdrop-blur-sm"
      style={{ left: x + (flip ? -14 : 14), top: Math.max(4, y), transform: flip ? "translateX(-100%)" : undefined }}
    >
      {children}
    </div>
  );
}

export function TipTitle({ children }: { children: ReactNode }) {
  return <div className="mb-1 text-[11px] font-medium text-gray-500">{children}</div>;
}

/** Values lead, labels follow — the reader already knows the series and wants the number. */
export function TipRow({ color, value, label, shape = "line" }: { color?: string; value: ReactNode; label: ReactNode; shape?: "line" | "box" | "dot" }) {
  return (
    <div className="flex items-center gap-2 py-px">
      {color && <Key color={color} shape={shape} />}
      <span className="ga-tabular font-semibold text-gray-900">{value}</span>
      <span className="truncate text-gray-500">{label}</span>
    </div>
  );
}
