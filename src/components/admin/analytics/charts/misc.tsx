import { useState, type CSSProperties } from "react";
import { useWidth } from "../hooks";
import { fmtPct, niceMax, onRamp, rampColor } from "../format";
import { Key } from "../ui";
import { ChartTooltip, TipRow, TipTitle } from "./Tooltip";

/** A 12-ish point trend under a stat tile: de-emphasised, current end in the accent. */
export function Sparkline({ values, color = "#2a78d6", height = 30 }: { values: number[]; color?: string; height?: number }) {
  const finite = values.filter(Number.isFinite);
  if (values.length < 2 || finite.length < 2) return <div style={{ height }} />;
  const max = Math.max(1e-9, ...finite);
  const xy = (v: number, i: number) => [(i / (values.length - 1)) * 100, 100 - (v / max) * 92 - 4] as const;
  // A day without a value (no sessions to divide by) breaks the line rather than reading as zero.
  const segs: Array<Array<readonly [number, number]>> = [];
  let cur: Array<readonly [number, number]> = [];
  values.forEach((v, i) => {
    if (Number.isFinite(v)) cur.push(xy(v, i));
    else if (cur.length) { segs.push(cur); cur = []; }
  });
  if (cur.length) segs.push(cur);
  const line = segs.map((s) => `M${s.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}`).join("");
  const area = segs.filter((s) => s.length > 1).map((s) => `M${s.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}L${s[s.length - 1][0].toFixed(2)},100L${s[0][0].toFixed(2)},100Z`).join("");
  const last = segs[segs.length - 1][segs[segs.length - 1].length - 1];
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full overflow-visible" style={{ height }} aria-hidden>
      <path d={area} fill={color} opacity={0.08} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.6} vectorEffect="non-scaling-stroke" strokeLinejoin="round" pathLength={1} className="ga-draw" />
      <circle cx={last[0]} cy={last[1]} r={2.4} fill={color} vectorEffect="non-scaling-stroke" className="ga-pop" style={{ transformBox: "fill-box" }} />
    </svg>
  );
}

/** Part-to-whole in one 100% bar (≤ 6 parts), with a legend that carries the numbers. */
export function ShareBar({ parts, format }: { parts: Array<{ label: string; value: number; color: string }>; format: (n: number) => string }) {
  const total = parts.reduce((a, p) => a + p.value, 0);
  const shown = parts.filter((p) => p.value > 0);
  if (!total) return <p className="text-[12px] text-gray-400">데이터 없음</p>;
  return (
    <div>
      <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full">
        {shown.map((p, i) => (
          <div
            key={p.label}
            title={`${p.label}: ${format(p.value)} (${fmtPct(p.value / total)})`}
            className="ga-grow-x h-full first:rounded-l-full last:rounded-r-full"
            style={{ width: `${(p.value / total) * 100}%`, background: p.color, "--i": i } as CSSProperties}
          />
        ))}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
        {shown.map((p) => (
          <li key={p.label} className="flex items-center gap-1.5 text-[11.5px]">
            <Key color={p.color} shape="box" />
            <span className="truncate text-gray-600">{p.label}</span>
            <span className="ga-tabular ml-auto font-semibold text-gray-900">{fmtPct(p.value / total, 0)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Active users per minute for the last 30 minutes, oldest on the left. */
export function MinuteBars({ minutes, height = 150 }: { minutes: number[]; height?: number }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const data = [...minutes].reverse(); // index 0 = 29 minutes ago
  const top = niceMax(Math.max(1, ...data));
  const m = { top: 6, bottom: 22 };
  const h = height - m.top - m.bottom;
  const band = width / 30;
  const barW = Math.max(2, Math.min(14, band * 0.66));

  return (
    <div ref={ref} className="relative" style={{ height }} onPointerLeave={() => setHover(null)}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label="최근 30분, 분당 접속자">
          <line x1={0} x2={width} y1={m.top + h} y2={m.top + h} stroke="#d6d4cc" />
          {data.map((v, i) => {
            const bh = Math.max(v > 0 ? 3 : 0, (v / top) * h);
            const x = band * i + (band - barW) / 2;
            return (
              <g key={`${i}-${v}`}>
                <rect x={x} y={m.top + h - bh} width={barW} height={bh} rx={Math.min(3, barW / 2)} fill={i === 29 ? "#ff2e97" : "#2a78d6"} opacity={hover == null || hover === i ? 1 : 0.5} className="ga-grow-y" style={{ "--i": i } as CSSProperties} />
                <rect x={band * i} y={0} width={band} height={height} fill="transparent" onPointerEnter={() => setHover(i)} />
              </g>
            );
          })}
          <text x={0} y={height - 6} className="fill-gray-400 text-[10.5px]">30분 전</text>
          <text x={width} y={height - 6} textAnchor="end" className="fill-gray-400 text-[10.5px]">지금</text>
        </svg>
      )}
      {hover != null && (
        <ChartTooltip x={band * hover + band / 2} y={m.top} width={width}>
          <TipTitle>{29 - hover === 0 ? "지금 이 1분" : `${29 - hover}분 전`}</TipTitle>
          <TipRow color={hover === 29 ? "#ff2e97" : "#2a78d6"} shape="box" value={`${data[hover]}명`} label="접속" />
        </ChartTooltip>
      )}
    </div>
  );
}

/** Weekly retention: each row a first-visit week, each column the weeks after. */
export function CohortGrid({ cohorts, label }: { cohorts: Array<{ start: string; end: string; size: number; active: Array<number | null> }>; label: (c: { start: string; end: string }) => string }) {
  const weeks = cohorts[0]?.active.length ?? 0;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-separate border-spacing-[2px] text-[11.5px]">
        <thead>
          <tr className="text-gray-500">
            <th className="px-2 py-1 text-left font-medium">처음 온 주</th>
            <th className="px-2 py-1 text-right font-medium">사람 수</th>
            {Array.from({ length: weeks }, (_, w) => (
              <th key={w} className="px-1 py-1 text-center font-medium">{w === 0 ? "첫 주" : `${w}주 뒤`}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map((c, ri) => (
            <tr key={c.start}>
              <td className="whitespace-nowrap px-2 py-1 text-gray-700">{label(c)}</td>
              <td className="ga-tabular px-2 py-1 text-right font-semibold text-gray-900">{c.size.toLocaleString("en-US")}</td>
              {c.active.map((a, w) => {
                if (a == null) return <td key={w} />;
                const r = c.size ? a / c.size : 0;
                // Week 0 is 100% by definition; the scale is set by the weeks after it.
                const t = w === 0 ? 1 : Math.min(1, r / 0.25);
                return (
                  <td
                    key={w}
                    title={`${c.size}명 중 ${a}명`}
                    className="ga-fade ga-tabular rounded-[5px] px-1 py-1.5 text-center font-semibold"
                    style={{ background: rampColor(t), color: onRamp(t), "--i": ri + w } as CSSProperties}
                  >
                    {w === 0 ? "100%" : fmtPct(r, r < 0.1 ? 1 : 0)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
