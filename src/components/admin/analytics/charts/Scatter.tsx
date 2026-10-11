import { useState, type CSSProperties } from "react";
import { useWidth } from "../hooks";
import { niceMax } from "../format";
import { ChartTooltip, TipRow, TipTitle } from "./Tooltip";

export interface Point { id: string; x: number; y: number; label: string; highlight?: boolean; onClick?: () => void }

/**
 * Traffic (x, log scale) against engagement (y), split into quadrants at the
 * medians. Each dot has a 24px hit area; the nearest dot to the pointer wins,
 * so nobody has to land on a pinpoint.
 */
export function Scatter({ points, xLabel, yLabel, xFormat, yFormat, quadrants, height = 320 }: {
  points: Point[];
  xLabel: string;
  yLabel: string;
  xFormat: (n: number) => string;
  yFormat: (n: number) => string;
  quadrants: { topLeft: string; topRight: string; bottomLeft: string; bottomRight: string };
  height?: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<Point | null>(null);
  const m = { top: 12, right: 16, bottom: 36, left: 48 };
  const w = Math.max(0, width - m.left - m.right);
  const h = height - m.top - m.bottom;

  const xMin = 1;
  const xMax = Math.max(10, ...points.map((p) => p.x));
  const yMax = niceMax(Math.max(1, ...points.map((p) => p.y)));
  const lx = (v: number) => Math.log10(Math.max(xMin, v));
  const x = (v: number) => m.left + ((lx(v) - lx(xMin)) / (lx(xMax) - lx(xMin) || 1)) * w;
  const y = (v: number) => m.top + h - (v / yMax) * h;

  const median = (vals: number[]) => {
    const s = [...vals].sort((a, b) => a - b);
    return s.length ? s[Math.floor(s.length / 2)] : 0;
  };
  const mx = median(points.map((p) => p.x));
  const my = median(points.map((p) => p.y));

  const xTicks = [1, 10, 100, 1000, 10000, 100000].filter((t) => t <= xMax * 1.01);
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * yMax);

  const nearest = (px: number, py: number) => {
    let best: Point | null = null, bestD = 18 * 18;
    for (const p of points) {
      const d = (x(p.x) - px) ** 2 + (y(p.y) - py) ** 2;
      if (d < bestD) { bestD = d; best = p; }
    }
    return best;
  };

  return (
    <div ref={ref} className="relative" style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`${xLabel} 대비 ${yLabel}`}
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setHover(nearest(e.clientX - r.left, e.clientY - r.top));
          }}
          onPointerLeave={() => setHover(null)}
          onClick={() => hover?.onClick?.()}
          className={hover?.onClick ? "cursor-pointer" : undefined}
        >
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={m.left} x2={m.left + w} y1={y(t)} y2={y(t)} stroke={t === 0 ? "#d6d4cc" : "#f1f0ec"} />
              <text x={m.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="ga-tabular fill-gray-400 text-[10.5px]">{yFormat(t)}</text>
            </g>
          ))}
          {xTicks.map((t) => (
            <text key={t} x={x(t)} y={m.top + h + 16} textAnchor="middle" className="ga-tabular fill-gray-400 text-[10.5px]">{xFormat(t)}</text>
          ))}
          <text x={m.left + w} y={height - 4} textAnchor="end" className="fill-gray-500 text-[10.5px]">{xLabel} →</text>
          <text x={m.left} y={m.top - 2} className="fill-gray-500 text-[10.5px]" dy="-0.2em">↑ {yLabel}</text>

          {/* Quadrants at the medians */}
          <line x1={x(mx)} x2={x(mx)} y1={m.top} y2={m.top + h} stroke="#d6d4cc" />
          <line x1={m.left} x2={m.left + w} y1={y(my)} y2={y(my)} stroke="#d6d4cc" />
          <text x={m.left + 6} y={m.top + 12} className="fill-emerald-700 text-[10.5px] font-semibold">{quadrants.topLeft}</text>
          <text x={m.left + w - 6} y={m.top + 12} textAnchor="end" className="fill-primary text-[10.5px] font-semibold">{quadrants.topRight}</text>
          <text x={m.left + 6} y={m.top + h - 6} className="fill-gray-400 text-[10.5px] font-semibold">{quadrants.bottomLeft}</text>
          <text x={m.left + w - 6} y={m.top + h - 6} textAnchor="end" className="fill-red-700 text-[10.5px] font-semibold">{quadrants.bottomRight}</text>

          {points.map((p, i) => (
            <circle
              key={p.id}
              cx={x(p.x)}
              cy={y(p.y)}
              r={hover?.id === p.id ? 6 : 4.5}
              fill={p.highlight ? "#ff2e97" : "#2a78d6"}
              fillOpacity={hover && hover.id !== p.id ? 0.35 : 0.85}
              stroke="#fff"
              strokeWidth={2}
              className="ga-pop"
              style={{ "--i": i } as CSSProperties}
            />
          ))}
        </svg>
      )}
      {hover && (
        <ChartTooltip x={x(hover.x)} y={Math.max(0, y(hover.y) - 20)} width={width}>
          <TipTitle>{hover.label}</TipTitle>
          <TipRow value={xFormat(hover.x)} label={xLabel} />
          <TipRow value={yFormat(hover.y)} label={yLabel} />
          {hover.onClick && <div className="mt-1 text-[10.5px] text-gray-400">누르면 상세 보기</div>}
        </ChartTooltip>
      )}
    </div>
  );
}
