import { AlertTriangle, Loader2 } from "lucide-react";
import { Card } from "../ui";
import { CountUp } from "../motion";
import { BarList } from "../charts/BarList";
import { MinuteBars, ShareBar } from "../charts/misc";
import { countryKo, deviceColor, deviceKo, eventKo, fmtNum } from "../format";
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
            지금 사이트에 있는 사람 · 최근 30분
          </div>
          <p className="mt-3 text-[64px] font-bold leading-none tracking-tight">
            <CountUp value={data.activeUsers} format={fmtNum} />
          </p>
          <p className="mt-3 text-[12px] text-white/70">최근 5분 안에 {fmtNum(lastFive)}명 활동</p>
          <p className="mt-6 flex items-center gap-1.5 text-[11px] text-white/50">
            {isFetching && <Loader2 className="h-3 w-3 animate-spin" />}
            {new Date(updatedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} 기준 · 30초마다 새로고침
          </p>
        </section>
        <Card className="ga-rise lg:col-span-2" title="분당 접속자" subtitle="왼쪽이 30분 전, 오른쪽 분홍이 지금입니다. 릴스를 올린 직후 오른쪽이 솟으면 반응이 온 것입니다.">
          <MinuteBars minutes={data.minutes} height={190} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="ga-rise" title="지금 읽고 있는 페이지" subtitle="관리자 화면은 뺐습니다">
          <BarList
            empty="지금 사이트를 보는 사람이 없습니다."
            rows={data.pages.map((p) => ({
              key: p.unifiedScreenName,
              label: short(p.unifiedScreenName),
              text: p.unifiedScreenName,
              value: p.activeUsers,
              display: `${fmtNum(p.activeUsers)}명`,
              sub: `조회 ${fmtNum(p.screenPageViews)}`,
            }))}
          />
        </Card>
        <Card className="ga-rise" title="어디에서 보나">
          <BarList empty="지금은 아무도 없습니다." rows={data.countries.map((c) => ({ key: c.country, label: countryKo("", c.country), value: c.activeUsers, display: `${fmtNum(c.activeUsers)}명` }))} />
          <div className="mt-5">
            <ShareBar format={fmtNum} parts={data.devices.map((x) => ({ label: deviceKo(x.deviceCategory), value: x.activeUsers, color: deviceColor(x.deviceCategory) }))} />
          </div>
        </Card>
        <Card className="ga-rise" title="무엇을 하고 있나" subtitle="최근 30분의 행동">
          <BarList empty="지금은 행동 기록이 없습니다." rows={data.events.map((e) => ({ key: e.eventName, label: eventKo(e.eventName) ?? e.eventName, text: e.eventName, value: e.eventCount, display: `${fmtNum(e.eventCount)}회`, color: e.eventName === "click" || e.eventName === "affiliate_click" ? "#ff2e97" : undefined }))} />
        </Card>
      </div>
    </div>
  );
}
