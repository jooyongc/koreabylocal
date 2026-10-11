import { useState, type CSSProperties } from "react";
import { useWidth } from "../hooks";
import { fmtCompact, niceMax } from "../format";
import { ChartTooltip, TipRow, TipTitle } from "./Tooltip";

export interface StackSeries { key: string; label: string; color: string; values: number[] }

/** A rect whose top corners are rounded (the data end); the baseline stays square. */
function roundedTop(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

/**
 * Columns stacked by series, bottom to top in the given order. Segments are
 * separated by a 2px surface gap, not a border; each column is its own hover
 * target and lists every series in it.
 */
export function StackedColumns({ labels, series, height = 240, format, labelOf, ariaLabel }: {
  labels: string[];
  series: StackSeries[];
  height?: number;
  format: (n: number) => string;
  labelOf: (label: string) => string;
  ariaLabel: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const n = labels.length;
  const totals = labels.map((_, i) => series.reduce((sum, s) => sum + (s.values[i] ?? 0), 0));
  const top = niceMax(Math.max(0, ...totals));
  const ticks = [0, 0.5, 1].map((t) => t * top);
  const left = Math.max(28, Math.max(...ticks.map((t) => fmtCompact(t).length)) * 6.6 + 10);
  const m = { top: 8, right: 8, bottom: 26, left };
  const w = Math.max(0, width - m.left - m.right);
  const h = height - m.top - m.bottom;
  const band = n ? w / n : 0;
  const barW = Math.max(2, Math.min(24, band * 0.72));
  const y = (v: number) => (v / top) * h;

  const step = Math.max(1, Math.ceil(n / 7));

  return (
    <div ref={ref} className="relative" style={{ height }} onPointerLeave={() => setHover(null)}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={m.left} x2={m.left + w} y1={m.top + h - y(t)} y2={m.top + h - y(t)} stroke={t === 0 ? "#d6d4cc" : "#eeede8"} />
              <text x={m.left - 8} y={m.top + h - y(t)} dy="0.32em" textAnchor="end" className="ga-tabular fill-gray-400 text-[10.5px]">{fmtCompact(t)}</text>
            </g>
          ))}
          {labels.map((l, i) => {
            const cx = m.left + band * i + band / 2;
            let base = m.top + h;
            const parts = series.map((s) => ({ s, v: s.values[i] ?? 0 })).filter((p) => p.v > 0);
            const topIdx = parts.length - 1;
            return (
              <g key={`${l}-${totals[i]}`} opacity={hover == null || hover === i ? 1 : 0.55}>
                <g className="ga-grow-y" style={{ "--i": i } as CSSProperties}>
                {parts.map((p, k) => {
                  const segH = y(p.v);
                  // The gap comes out of the segment above, so totals stay true to scale.
                  const gap = k > 0 ? Math.min(2, segH / 2) : 0;
                  const yTop = base - segH;
                  const el = k === topIdx
                    ? <path key={p.s.key} d={roundedTop(cx - barW / 2, yTop, barW, segH - gap, 4)} fill={p.s.color} />
                    : <rect key={p.s.key} x={cx - barW / 2} y={yTop} width={barW} height={Math.max(0, segH - gap)} fill={p.s.color} />;
                  base = yTop;
                  return el;
                })}
                </g>
                {(i % step === 0 || i === n - 1) && (
                  <text x={cx} y={height - 8} textAnchor="middle" className="fill-gray-400 text-[10.5px]">{labelOf(l)}</text>
                )}
                <rect
                  x={m.left + band * i}
                  y={m.top}
                  width={band}
                  height={h}
                  fill="transparent"
                  onPointerEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  tabIndex={0}
                  className="outline-none"
                />
              </g>
            );
          })}
        </svg>
      )}
      {hover != null && width > 0 && (
        <ChartTooltip x={m.left + band * hover + band / 2} y={m.top} width={width}>
          <TipTitle>{labelOf(labels[hover])} · {format(totals[hover])} total</TipTitle>
          {[...series].reverse().filter((s) => (s.values[hover] ?? 0) > 0).map((s) => (
            <TipRow key={s.key} color={s.color} shape="box" value={format(s.values[hover])} label={s.label} />
          ))}
        </ChartTooltip>
      )}
    </div>
  );
}
