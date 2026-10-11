import { Card } from "../ui";
import { CohortGrid } from "../charts/misc";
import { BarList } from "../charts/BarList";
import { fmtDay, fmtDuration, fmtNum, fmtPct, ratio } from "../format";
import { hint } from "../glossary";
import type { Report } from "../types";

export function RetentionTab({ r }: { r: Report }) {
  const cohorts = r.cohorts.filter((c) => c.size > 0);
  const weeks = cohorts[0]?.active.length ?? 0;

  // Average return rate for each week after the first visit, over the cohorts that have reached it.
  const curve = Array.from({ length: weeks }, (_, w) => {
    const reached = cohorts.filter((c) => c.active[w] != null);
    const size = reached.reduce((n, c) => n + c.size, 0);
    const active = reached.reduce((n, c) => n + (c.active[w] ?? 0), 0);
    return { week: w, rate: ratio(active, size), cohorts: reached.length };
  }).filter((x) => x.week > 0 && x.cohorts > 0);

  const ret = r.userType.find((u) => u.newVsReturning === "returning");
  const neu = r.userType.find((u) => u.newVsReturning === "new");

  return (
    <div className="space-y-5">
      <Card
        className="ga-rise"
        title="주별 재방문"
        help={hint("cohort")}
        subtitle="한 줄 = 같은 주에 처음 온 사람들. 칸 = 그중 몇 주 뒤에 다시 온 비율. 진할수록 많이 돌아왔습니다."
      >
        {cohorts.length ? (
          <CohortGrid cohorts={cohorts} label={(c) => `${fmtDay(c.start)} – ${fmtDay(c.end)}`} />
        ) : (
          <p className="text-[12px] text-gray-400">아직 재방문 데이터가 없습니다.</p>
        )}
        <p className="mt-3 text-[11px] text-gray-400">
          재방문 표는 위에서 고른 기간과 상관없이 어제까지의 최근 8주를 씁니다. '봇 의심 제외'를 켜면 그 나라들은 빠집니다.
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="ga-rise" title="몇 주 뒤에 얼마나 돌아오나" subtitle="그 주가 지난 묶음들의 평균">
          <BarList
            empty="아직 지난 주가 충분하지 않습니다."
            rows={curve.map((c) => ({
              key: String(c.week),
              label: `${c.week}주 뒤`,
              value: c.rate,
              display: fmtPct(c.rate, c.rate < 0.1 ? 1 : 0),
              sub: `${c.cohorts}개 묶음 평균`,
            }))}
          />
        </Card>
        <Card className="ga-rise" title="왜 중요한가" subtitle="이번 기간, 처음 온 사람과 다시 온 사람 비교">
          {ret && neu ? (
            <div className="grid grid-cols-2 gap-4">
              {[{ label: "처음 온 사람", u: neu }, { label: "다시 온 사람", u: ret }].map(({ label, u }) => (
                <div key={label} className="rounded-xl bg-gray-50 p-3">
                  <p className="text-[11.5px] font-medium text-gray-500">{label}</p>
                  <p className="mt-1 text-[22px] font-bold text-primary">{fmtNum(u.activeUsers)}명</p>
                  <dl className="mt-2 space-y-1 text-[11.5px] text-gray-600">
                    <div className="flex justify-between"><dt>참여율</dt><dd className="ga-tabular font-semibold text-gray-900">{fmtPct(ratio(u.engagedSessions, u.sessions), 0)}</dd></div>
                    <div className="flex justify-between"><dt>1인당 시간</dt><dd className="ga-tabular font-semibold text-gray-900">{fmtDuration(ratio(u.userEngagementDuration, u.activeUsers))}</dd></div>
                    <div className="flex justify-between"><dt>방문당 페이지</dt><dd className="ga-tabular font-semibold text-gray-900">{ratio(u.screenPageViews, u.sessions).toFixed(2)}</dd></div>
                  </dl>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-gray-400">이번 기간에는 다시 온 사람이 없습니다.</p>
          )}
          <p className="mt-4 text-[12px] leading-relaxed text-gray-600">
            재방문을 늘리는 방법: 가이드 끝에 뉴스레터 신청 상자, 인스타그램 팔로우 안내, 연재 글('서울 3일 코스 2편'), '여행 때 저장해 두세요' 전자책 안내.
          </p>
        </Card>
      </div>
    </div>
  );
}
