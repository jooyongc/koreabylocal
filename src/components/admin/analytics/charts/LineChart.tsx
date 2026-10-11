import { useState, type KeyboardEvent, type PointerEvent } from "react";
import { useWidth } from "../hooks";
import { fmtCompact, fmtDay, niceMax } from "../format";
import { ChartTooltip, TipRow, TipTitle } from "./Tooltip";

export interface LineSeries {
  key: string;
  label: string;
  color: string;
  values: number[];
  /** Dates behind each value — the comparison period has its own. */
  dates?: string[];
  area?: boolean;
  /** Recessive context (the comparison period): thinner, no end dot. */
  muted?: boolean;
}

/**
 * A time series with a crosshair: a hairline follows the pointer, snaps to
 * the nearest day and lists every series there. Arrow keys do the same.
 */
export function LineChart({ series, dates, height = 240, format, ariaLabel }: {
  series: LineSeries[];
  dates: string[];
  height?: number;
  format: (n: number) => string;
  ariaLabel: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const n = dates.length;

  const top = niceMax(Math.max(0, ...series.flatMap((s) => s.values)));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * top);
  const left = Math.max(28, Math.max(...ticks.map((t) => fmtCompact(t).length)) * 6.6 + 10);
  const m = { top: 10, right: 14, bottom: 26, left };
  const w = Math.max(0, width - m.left - m.right);
  const h = height - m.top - m.bottom;

  const x = (i: number) => m.left + (n <= 1 ? w / 2 : (i / (n - 1)) * w);
  const y = (v: number) => m.top + h - (v / top) * h;

  const paths = series.map((s) => {
    const pts = s.values.slice(0, n).map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
    const line = pts.length ? `M${pts.join("L")}` : "";
    const area = s.area && pts.length ? `${line}L${x(pts.length - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z` : "";
    return { line, area };
  });

  // ~6 date labels, always including the last day.
  const step = Math.max(1, Math.ceil(n / 6));
  const xTicks = Array.from({ length: n }, (_, i) => i).filter((i) => i % step === 0 || i === n - 1)
    .filter((i, k, arr) => i === n - 1 || arr[k + 1] === undefined || x(arr[k + 1]) - x(i) > 44);

  const onMove = (e: PointerEvent<SVGRectElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    setHover(n <= 1 ? 0 : Math.max(0, Math.min(n - 1, Math.round((px / r.width) * (n - 1)))));
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") setHover((v) => Math.min(n - 1, (v ?? -1) + 1));
    else if (e.key === "ArrowLeft") setHover((v) => Math.max(0, (v ?? n) - 1));
    else if (e.key === "Escape") setHover(null);
  };
  const sig = series.map((s) => `${s.key}:${s.values.length}:${s.values.reduce((a, b) => a + b, 0)}`).join("|");

  return (
    <div ref={ref} className="relative" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel} className="overflow-visible">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={m.left} x2={m.left + w} y1={y(t)} y2={y(t)} stroke={t === 0 ? "#d6d4cc" : "#eeede8"} strokeWidth={1} />
              <text x={m.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="ga-tabular fill-gray-400 text-[10.5px]">{fmtCompact(t)}</text>
            </g>
          ))}
          {xTicks.map((i) => (
            <text key={i} x={x(i)} y={height - 8} textAnchor={i === 0 && n > 1 ? "start" : i === n - 1 && n > 1 ? "end" : "middle"} className="fill-gray-400 text-[10.5px]">
              {fmtDay(dates[i])}
            </text>
          ))}

          {/* Draw the muted (comparison) series first so the current period sits on top. */}
          {[...series.keys()].sort((a, b) => Number(!series[a].muted) - Number(!series[b].muted)).map((k) => {
            const s = series[k];
            return (
              <g key={`${s.key}-${sig}`}>
                {paths[k].area && <path d={paths[k].area} fill={s.color} opacity={0.1} className="ga-fade" />}
                <path
                  d={paths[k].line}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={s.muted ? 1.5 : 2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  pathLength={1}
                  className="ga-draw"
                />
                {!s.muted && s.values.length > 0 && (
                  <circle cx={x(Math.min(n, s.values.length) - 1)} cy={y(s.values[Math.min(n, s.values.length) - 1])} r={4} fill={s.color} stroke="#fff" strokeWidth={2} className="ga-pop" />
                )}
              </g>
            );
          })}

          {hover != null && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={m.top} y2={m.top + h} stroke="#9ca3af" strokeWidth={1} />
              {series.map((s) => s.values[hover] != null && (
                <circle key={s.key} cx={x(hover)} cy={y(s.values[hover])} r={4.5} fill={s.color} stroke="#fff" strokeWidth={2} />
              ))}
            </g>
          )}

          <rect
            x={m.left}
            y={m.top}
            width={w}
            height={h}
            fill="transparent"
            tabIndex={0}
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
            onKeyDown={onKey}
            onBlur={() => setHover(null)}
            className="cursor-crosshair outline-none focus-visible:stroke-gray-300"
          />
        </svg>
      )}
      {hover != null && width > 0 && (
        <ChartTooltip x={x(hover)} y={m.top} width={width}>
          <TipTitle>{fmtDay(dates[hover], true)}</TipTitle>
          {series.map((s) => s.values[hover] != null && (
            <TipRow
              key={s.key}
              color={s.color}
              value={format(s.values[hover])}
              label={s.dates?.[hover] && s.dates[hover] !== dates[hover] ? `${s.label} · ${fmtDay(s.dates[hover])}` : s.label}
            />
          ))}
        </ChartTooltip>
      )}
    </div>
  );
}
