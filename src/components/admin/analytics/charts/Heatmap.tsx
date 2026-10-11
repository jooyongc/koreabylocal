import { useState, type CSSProperties } from "react";
import { RAMP, RAMP_ZERO, WEEKDAYS, onRamp, rampColor } from "../format";

/**
 * Weekday × hour grid, one hue light → dark. The hovered cell is spelled out
 * under the grid (and in each cell's title), so nothing depends on reading a
 * shade.
 */
export function Heatmap({ matrix, unit, zoneLabel }: { matrix: number[][]; unit: string; zoneLabel: string }) {
  const [hover, setHover] = useState<{ d: number; h: number } | null>(null);
  const max = Math.max(0, ...matrix.flat());
  const total = matrix.flat().reduce((a, b) => a + b, 0);

  let peak = { d: 0, h: 0, v: -1 };
  matrix.forEach((row, d) => row.forEach((v, h) => { if (v > peak.v) peak = { d, h, v }; }));

  const hourLabel = (h: number) => `${String(h).padStart(2, "0")}:00`;
  const focus = hover ?? (peak.v > 0 ? { d: peak.d, h: peak.h } : null);

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[520px] gap-[2px]" style={{ gridTemplateColumns: "34px repeat(24, minmax(0, 1fr))" }} onPointerLeave={() => setHover(null)}>
          <span />
          {Array.from({ length: 24 }, (_, h) => (
            <span key={h} className="text-center text-[9.5px] text-gray-400">{h % 3 === 0 ? h : ""}</span>
          ))}
          {matrix.map((row, d) => (
            <div key={d} className="contents">
              <span className="pr-1 text-right text-[10.5px] leading-[20px] text-gray-500">{WEEKDAYS[d]}</span>
              {row.map((v, h) => {
                const t = max ? v / max : 0;
                const isPeak = peak.v > 0 && d === peak.d && h === peak.h;
                return (
                  <button
                    key={h}
                    type="button"
                    title={`${WEEKDAYS[d]} ${hourLabel(h)} · ${v} ${unit}`}
                    onPointerEnter={() => setHover({ d, h })}
                    onFocus={() => setHover({ d, h })}
                    className={`ga-fade h-5 rounded-[4px] text-[8.5px] font-bold outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-accent ${isPeak ? "ring-2 ring-accent ring-offset-1" : ""}`}
                    style={{ background: t > 0 ? rampColor(t) : RAMP_ZERO, color: onRamp(t), "--i": h + d } as CSSProperties}
                  >
                    {isPeak ? "★" : ""}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11.5px]">
        <p className="text-gray-600">
          {focus ? (
            <>
              <strong className="text-gray-900">{WEEKDAYS[focus.d]} {hourLabel(focus.h)}–{hourLabel((focus.h + 1) % 24)}</strong>
              {" · "}{matrix[focus.d][focus.h]} {unit}
              {total > 0 && <span className="text-gray-400"> ({((matrix[focus.d][focus.h] / total) * 100).toFixed(1)}% of the week)</span>}
              {!hover && <span className="text-gray-400"> — busiest hour</span>}
            </>
          ) : "No data"}
          <span className="text-gray-400"> · {zoneLabel}</span>
        </p>
        <div className="flex items-center gap-1 text-[10.5px] text-gray-400">
          fewer
          {[RAMP_ZERO, ...RAMP].map((c) => <span key={c} className="h-2.5 w-3 rounded-[2px]" style={{ background: c }} />)}
          more
        </div>
      </div>
    </div>
  );
}
