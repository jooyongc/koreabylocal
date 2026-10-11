import { AlertTriangle, Loader2 } from "lucide-react";
import { Card } from "../ui";
import { CountUp } from "../motion";
import { BarList } from "../charts/BarList";
import { MinuteBars, ShareBar } from "../charts/misc";
import { deviceColor, fmtNum } from "../format";
import { short } from "../insights";
import type { Realtime } from "../types";

export function RealtimeTab({ data, error, isFetching, updatedAt }: { data?: Realtime; error: Error | null; isFetching: boolean; updatedAt: number }) {
  if (error) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-[12.5px] text-amber-900">
        <AlertTriangle className="h-4 w-4 shrink-0" />{error.message}
      </div>
    );
  }
  if (!data) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const lastFive = data.minutes.slice(0, 5).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="ga-rise relative overflow-hidden rounded-2xl bg-primary p-6 text-white">
          <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-accent/25 blur-2xl" aria-hidden />
          <div className="flex items-center gap-2 text-[12px] font-medium text-white/70">
            <span className="relative flex h-2.5 w-2.5">
              <span className="ga-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            Active users · last 30 minutes
          </div>
          <p className="mt-3 text-[64px] font-bold leading-none tracking-tight">
            <CountUp value={data.activeUsers} format={fmtNum} />
          </p>
          <p className="mt-3 text-[12px] text-white/70">{fmtNum(lastFive)} active in the last 5 minutes</p>
          <p className="mt-6 flex items-center gap-1.5 text-[11px] text-white/50">
            {isFetching && <Loader2 className="h-3 w-3 animate-spin" />}
            Updated {new Date(updatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} · refreshes every 30s
          </p>
        </section>
        <Card className="ga-rise lg:col-span-2" title="Active users per minute">
          <MinuteBars minutes={data.minutes} height={190} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="ga-rise" title="Pages being read" subtitle="Admin screens left out">
          <BarList
            empty="Nobody on a public page right now."
            rows={data.pages.map((p) => ({
              key: p.unifiedScreenName,
              label: short(p.unifiedScreenName),
              text: p.unifiedScreenName,
              value: p.activeUsers,
              display: fmtNum(p.activeUsers),
              sub: `${fmtNum(p.screenPageViews)} views`,
            }))}
          />
        </Card>
        <Card className="ga-rise" title="Where they are">
          <BarList empty="No one right now." rows={data.countries.map((c) => ({ key: c.country, label: c.country, value: c.activeUsers, display: fmtNum(c.activeUsers) }))} />
          <div className="mt-5">
            <ShareBar format={fmtNum} parts={data.devices.map((x) => ({ label: x.deviceCategory, value: x.activeUsers, color: deviceColor(x.deviceCategory) }))} />
          </div>
        </Card>
        <Card className="ga-rise" title="What they are doing" subtitle="Events in the last 30 minutes">
          <BarList empty="No events right now." rows={data.events.map((e) => ({ key: e.eventName, label: e.eventName, value: e.eventCount, display: fmtNum(e.eventCount), color: e.eventName === "click" || e.eventName === "affiliate_click" ? "#ff2e97" : undefined }))} />
        </Card>
      </div>
    </div>
  );
}
