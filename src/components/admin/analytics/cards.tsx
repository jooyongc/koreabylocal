import { useState, type CSSProperties } from "react";
import { AlertOctagon, AlertTriangle, ArrowRight, CheckCircle2, Info, Lightbulb, TrendingUp } from "lucide-react";
import { CountUp } from "./motion";
import { Delta, Hint } from "./ui";
import { Sparkline } from "./charts/misc";
import { useGoToTab, useOpenDrill } from "./context";
import type { Insight, Tone } from "./insights";
import type { HealthCheck, Severity } from "./health";

/** label · value · delta vs the comparison period · trend. Click to chart it. */
export function KpiTile({ label, value, format, prev, lowerIsBetter, spark, sub, hint, i = 0, active, onClick }: {
  label: string;
  value: number;
  format: (n: number) => string;
  prev?: number | null;
  lowerIsBetter?: boolean;
  spark?: number[];
  sub?: string;
  hint?: string;
  i?: number;
  active?: boolean;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-pressed={onClick ? active : undefined}
      className={`ga-rise group relative flex flex-col overflow-hidden rounded-2xl border bg-white p-4 text-left transition-all ${
        active ? "border-primary/40 shadow-[0_6px_20px_rgba(18,24,74,0.10)] ring-1 ring-primary/20" : "border-gray-200/80 hover:border-gray-300 hover:shadow-sm"
      }`}
      style={{ "--i": i } as CSSProperties}
    >
      {active && <span className="absolute inset-x-0 top-0 h-[3px] bg-accent" aria-hidden />}
      <div className="flex items-center text-[11.5px] font-medium text-gray-500">
        {label}
        {hint && <Hint text={hint} focusable={!onClick} align={i % 4 === 3 ? "right" : "left"} />}
      </div>
      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-[26px] font-bold leading-none tracking-tight text-primary">
          <CountUp value={value} format={format} />
        </span>
        {prev !== undefined && <Delta cur={value} prev={prev} lowerIsBetter={lowerIsBetter} />}
      </div>
      {sub && <div className="mt-1 text-[11px] text-gray-500">{sub}</div>}
      {spark && spark.length > 1 && (
        <div className="mt-auto pt-3">
          <Sparkline values={spark} color={active ? "#ff2e97" : "#2a78d6"} />
        </div>
      )}
    </Tag>
  );
}

const TONE: Record<Tone, { icon: typeof Info; label: string; bar: string; chip: string }> = {
  win: { icon: TrendingUp, label: "잘 되는 점", bar: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-800" },
  opportunity: { icon: Lightbulb, label: "해볼 만한 것", bar: "bg-accent", chip: "bg-pink-50 text-pink-800" },
  warning: { icon: AlertTriangle, label: "살펴볼 점", bar: "bg-amber-500", chip: "bg-amber-50 text-amber-800" },
  info: { icon: Info, label: "참고", bar: "bg-slate-400", chip: "bg-slate-100 text-slate-700" },
};

const TAB_LABEL: Record<string, string> = {
  overview: "개요", acquisition: "유입 경로", content: "콘텐츠", audience: "방문자",
  engagement: "클릭·행동", retention: "재방문", realtime: "실시간", health: "데이터 점검",
};

export function InsightCards({ insights, limit = 6 }: { insights: Insight[]; limit?: number }) {
  const [all, setAll] = useState(false);
  const openDrill = useOpenDrill();
  const goTo = useGoToTab();
  if (!insights.length) return <p className="text-[12px] text-gray-400">이 기간에는 인사이트를 낼 만큼 데이터가 쌓이지 않았습니다.</p>;
  const shown = all ? insights : insights.slice(0, limit);

  return (
    <div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((ins, i) => {
          const tone = TONE[ins.tone];
          const Icon = tone.icon;
          return (
            <article
              key={ins.id}
              className="ga-rise relative flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-4 pl-5"
              style={{ "--i": i } as CSSProperties}
            >
              <span className={`absolute inset-y-0 left-0 w-[3px] ${tone.bar}`} aria-hidden />
              <div className="flex items-start justify-between gap-3">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${tone.chip}`}>
                  <Icon className="h-3 w-3" aria-hidden />
                  {tone.label}
                </span>
                {ins.figure && <span className="ga-tabular text-[18px] font-bold leading-none text-primary">{ins.figure}</span>}
              </div>
              <h3 className="mt-2.5 text-[13.5px] font-semibold leading-snug text-gray-900">{ins.title}</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-gray-600">{ins.body}</p>
              {(ins.drill || (ins.tab && ins.tab !== "overview")) && (
                <div className="mt-auto flex flex-wrap gap-3 pt-3">
                  {ins.drill && (
                    <button type="button" onClick={() => openDrill(ins.drill!)} className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-primary hover:text-accent">
                      자세히 보기 <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                  {ins.tab && ins.tab !== "overview" && (
                    <button type="button" onClick={() => goTo(ins.tab!)} className="text-[11.5px] font-medium text-gray-500 hover:text-primary">
                      {TAB_LABEL[ins.tab]} 탭으로
                    </button>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
      {insights.length > limit && (
        <button type="button" onClick={() => setAll((v) => !v)} className="mt-3 text-[12px] font-medium text-primary/70 hover:text-primary">
          {all ? "접기" : `인사이트 ${insights.length}개 모두 보기`}
        </button>
      )}
    </div>
  );
}

const SEVERITY: Record<Severity, { icon: typeof Info; label: string; cls: string; ring: string }> = {
  critical: { icon: AlertOctagon, label: "중요", cls: "text-[#b42323] bg-red-50", ring: "border-l-[#d03b3b]" },
  warning: { icon: AlertTriangle, label: "주의", cls: "text-amber-800 bg-amber-50", ring: "border-l-amber-500" },
  info: { icon: Info, label: "참고", cls: "text-slate-700 bg-slate-100", ring: "border-l-slate-400" },
  good: { icon: CheckCircle2, label: "정상", cls: "text-[#006300] bg-emerald-50", ring: "border-l-emerald-500" },
};

export function HealthList({ checks }: { checks: HealthCheck[] }) {
  return (
    <ul className="space-y-3">
      {checks.map((c, i) => {
        const s = SEVERITY[c.severity];
        const Icon = s.icon;
        return (
          <li key={c.id} className={`ga-rise rounded-2xl border border-l-[3px] border-gray-200/80 bg-white p-4 ${s.ring}`} style={{ "--i": i } as CSSProperties}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${s.cls}`}>
                <Icon className="h-3 w-3" aria-hidden />{s.label}
              </span>
              <h3 className="text-[13.5px] font-semibold text-gray-900">{c.title}</h3>
            </div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-gray-600">{c.detail}</p>
            {c.action && (
              <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-[12px] leading-relaxed text-gray-700">
                <strong className="font-semibold text-primary">어떻게: </strong>{c.action}
              </p>
            )}
            {c.rows && c.rows.length > 0 && (
              <ul className="mt-2.5 divide-y divide-gray-100 rounded-lg border border-gray-100">
                {c.rows.map((row) => (
                  <li key={row.label} className="flex items-center justify-between gap-3 px-3 py-1.5 text-[11.5px]">
                    <span className="truncate font-mono text-gray-700">{row.label}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      {row.note && <span className="text-gray-400">{row.note}</span>}
                      <span className="ga-tabular font-semibold text-gray-900">{row.value}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
