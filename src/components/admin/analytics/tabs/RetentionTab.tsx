import { Card } from "../ui";
import { CohortGrid } from "../charts/misc";
import { BarList } from "../charts/BarList";
import { fmtDay, fmtDuration, fmtNum, fmtPct, ratio } from "../format";
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
        title="Weekly retention"
        subtitle="Each row is the week of a first visit; each cell, the share of those people who came back that many weeks later. Darker = more returned."
      >
        {cohorts.length ? (
          <CohortGrid cohorts={cohorts} label={(c) => `${fmtDay(c.start)} – ${fmtDay(c.end)}`} />
        ) : (
          <p className="text-[12px] text-gray-400">No cohort data yet.</p>
        )}
        <p className="mt-3 text-[11px] text-gray-400">
          Cohorts use the last eight full weeks (to yesterday) and ignore the date range above. Suspected bot countries are left out when that filter is on.
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="ga-rise" title="Return rate by week" subtitle="Average across the cohorts that have reached each week">
          <BarList
            empty="Not enough weeks yet."
            rows={curve.map((c) => ({
              key: String(c.week),
              label: `${c.week} week${c.week > 1 ? "s" : ""} later`,
              value: c.rate,
              display: fmtPct(c.rate, c.rate < 0.1 ? 1 : 0),
              sub: `${c.cohorts} cohort${c.cohorts > 1 ? "s" : ""}`,
            }))}
          />
        </Card>
        <Card className="ga-rise" title="Why it matters" subtitle="Returning visitors in this period">
          {ret && neu ? (
            <div className="grid grid-cols-2 gap-4">
              {[{ label: "First-time", u: neu }, { label: "Returning", u: ret }].map(({ label, u }) => (
                <div key={label} className="rounded-xl bg-gray-50 p-3">
                  <p className="text-[11.5px] font-medium text-gray-500">{label}</p>
                  <p className="mt-1 text-[22px] font-bold text-primary">{fmtNum(u.activeUsers)}</p>
                  <dl className="mt-2 space-y-1 text-[11.5px] text-gray-600">
                    <div className="flex justify-between"><dt>Engaged</dt><dd className="ga-tabular font-semibold text-gray-900">{fmtPct(ratio(u.engagedSessions, u.sessions), 0)}</dd></div>
                    <div className="flex justify-between"><dt>Time / user</dt><dd className="ga-tabular font-semibold text-gray-900">{fmtDuration(ratio(u.userEngagementDuration, u.activeUsers))}</dd></div>
                    <div className="flex justify-between"><dt>Views / session</dt><dd className="ga-tabular font-semibold text-gray-900">{ratio(u.screenPageViews, u.sessions).toFixed(2)}</dd></div>
                  </dl>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-gray-400">No returning visitors in this period.</p>
          )}
          <p className="mt-4 text-[12px] leading-relaxed text-gray-600">
            Ways to raise it: a newsletter box at the end of each guide, an Instagram follow prompt, multi-part series ("Seoul in 3 days, part 2"), and a "save this for your trip" e-book offer.
          </p>
        </Card>
      </div>
    </div>
  );
}
