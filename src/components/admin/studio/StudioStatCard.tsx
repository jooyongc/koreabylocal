import type { StudioStat } from "./types";

export default function StudioStatCard({ stat }: { stat: StudioStat }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-[18px]">
      <div className="text-xs text-white/55">{stat.key}</div>
      <div className="font-display mt-1.5 mb-1 text-[28px] font-extrabold leading-none text-white">
        {stat.value}
      </div>
      <div className={`text-xs font-semibold ${stat.deltaClass}`}>
        {stat.delta}
      </div>
    </div>
  );
}
