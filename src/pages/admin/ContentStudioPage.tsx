import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Sparkles, Target, PenLine, Share2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import PageSEO from "@/components/common/PageSEO";
import StudioStatCard from "@/components/admin/studio/StudioStatCard";
import PipelineStepCard from "@/components/admin/studio/PipelineStepCard";
import QueueRow from "@/components/admin/studio/QueueRow";
import NewDraftForm from "@/components/admin/studio/NewDraftForm";
import TopicIdeas from "@/components/admin/studio/TopicIdeas";
import { isPublished, type PipelineStep, type QueueJob, type StudioStat } from "@/components/admin/studio/types";
import { useAnalyticsReport } from "@/components/admin/analytics/useAnalytics";
import { compareState, derive } from "@/components/admin/analytics/derive";
import { change, fmtNum } from "@/components/admin/analytics/format";
import type { Report } from "@/components/admin/analytics/types";

// What the studio actually does, step by step.
const PIPELINE: PipelineStep[] = [
  {
    step: "1",
    title: "Topic ideas",
    description: "Claude suggests, checked against your posts",
    icon: <Target className="h-3.5 w-3.5" />,
  },
  {
    step: "2",
    title: "AI draft",
    description: "Claude writes it with FAQs",
    icon: <Sparkles className="h-3.5 w-3.5" />,
  },
  {
    step: "3",
    title: "Human review",
    description: "Edit and fact-check in Blog",
    icon: <PenLine className="h-3.5 w-3.5" />,
  },
  {
    step: "4",
    title: "Publish + schema",
    description: "FAQ/Article JSON-LD",
    icon: <Share2 className="h-3.5 w-3.5" />,
  },
];

async function fetchQueue(): Promise<QueueJob[]> {
  const { data, error } = await supabase
    .from("content_jobs")
    .select("id, topic, category, word_count, links_count, generated_title, blog_post_id, post:blog_posts(status)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function fetchPublished() {
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  const count = (since?: string) => {
    let q = supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "published");
    if (since) q = q.gte("published_at", since);
    return q;
  };
  const [all, week] = await Promise.all([count(), count(weekAgo)]);
  if (all.error) throw all.error;
  if (week.error) throw week.error;
  return { total: all.count ?? 0, lastWeek: week.count ?? 0 };
}

// The Analytics page's default view, so both pages share one GA4 report and
// always show the same numbers.
const GA4_VIEW = { days: 28, compare: "previous", excludeBots: true } as const;

/** "+12% vs previous 28 days", or just the window when a comparison would mislead. */
function vsPrevious(cur: number, prev: number, report: Report): Pick<StudioStat, "delta" | "deltaClass"> {
  const c = compareState(report).ok ? change(cur, prev) : { kind: "none" as const };
  if (c.kind === "change") {
    const pct = `${c.ratio > 0 ? "+" : ""}${Math.round(c.ratio * 100)}%`;
    return { delta: `${pct} vs previous 28 days`, deltaClass: c.ratio > 0 ? "text-green" : "text-accent" };
  }
  if (c.kind === "flat") return { delta: "Same as previous 28 days", deltaClass: "text-white/45" };
  return { delta: "Last 28 days", deltaClass: "text-white/45" };
}

const pending = (key: string, failed: boolean): StudioStat => ({
  key,
  value: "—",
  delta: failed ? "Couldn't load" : "Loading…",
  deltaClass: failed ? "text-accent" : "text-white/45",
});

export default function ContentStudioPage() {
  const queueQuery = useQuery({ queryKey: ["admin", "content-jobs"], queryFn: fetchQueue, staleTime: 30_000 });
  const publishedQuery = useQuery({ queryKey: ["admin", "published-count"], queryFn: fetchPublished, staleTime: 60_000 });
  const ga4 = useAnalyticsReport(GA4_VIEW);
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);

  const queue = queueQuery.data ?? [];
  const waiting = queue.filter((j) => j.post && !isPublished(j)).length;
  const publishedFromStudio = queue.filter(isPublished).length;

  const stats: StudioStat[] = [];
  stats.push(publishedQuery.data
    ? {
        key: "Published articles",
        value: fmtNum(publishedQuery.data.total),
        delta: `+${publishedQuery.data.lastWeek} in the last 7 days`,
        deltaClass: publishedQuery.data.lastWeek > 0 ? "text-green" : "text-white/45",
      }
    : pending("Published articles", publishedQuery.isError));

  const report = ga4.data;
  if (report) {
    const organic = report.channels.find((c) => c.sessionDefaultChannelGroup === "Organic Search");
    const sessions = organic?.sessions ?? 0;
    stats.push({ key: "Search visits (28 days)", value: fmtNum(sessions), ...vsPrevious(sessions, organic?.prev.sessions ?? 0, report) });
  } else {
    stats.push(pending("Search visits (28 days)", ga4.isError));
  }

  stats.push(queueQuery.data
    ? {
        key: "AI drafts to review",
        value: fmtNum(waiting),
        delta: `${publishedFromStudio} published from the studio`,
        deltaClass: "text-white/45",
      }
    : pending("AI drafts to review", queueQuery.isError));

  if (report) {
    const d = derive(report);
    stats.push({ key: "Partner clicks (28 days)", value: fmtNum(d.partnerClicks), ...vsPrevious(d.partnerClicks, d.prevPartnerClicks, report) });
  } else {
    stats.push(pending("Partner clicks (28 days)", ga4.isError));
  }

  const focusDraftForm = () => {
    document.getElementById("new-draft")?.scrollIntoView({ behavior: "smooth", block: "start" });
    (document.getElementById("studio-topic") as HTMLInputElement | null)?.focus();
  };
  const handlePickTopic = (title: string, kw: string[]) => {
    setTopic(title);
    setKeywords(kw.length ? kw : []);
    focusDraftForm();
  };

  return (
    <>
      <PageSEO
        title="Content Studio | Korea By Local Admin"
        description="AI-automated SEO/AEO content pipeline for koreabylocal.com."
        path="/admin/content-studio"
        noindex
      />

      <div className="min-h-full bg-[#0d0c24] text-white">
        {/* Header */}
        <section className="mx-auto max-w-[1180px] px-4 pt-6 sm:px-6 lg:px-8 lg:pt-10">
          <div className="flex flex-wrap items-center justify-between gap-3.5">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-display text-[22px] font-extrabold tracking-tight sm:text-[28px] lg:text-[32px]">
                  Content Studio
                </h1>
                <span className="rounded-full bg-gradient-to-r from-purple to-accent px-[11px] py-[5px] text-[11px] font-extrabold tracking-[0.06em] text-white">
                  AI AUTOMATED
                </span>
              </div>
              <p className="mt-1.5 text-[13px] text-white/50">
                Admin SEO/AEO content pipeline for koreabylocal.com
              </p>
            </div>
            <button
              type="button"
              onClick={focusDraftForm}
              className="flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(255,46,151,0.3)] transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <Sparkles className="h-4 w-4" />
              Generate new article
            </button>
          </div>
        </section>

        {/* Stats row */}
        <section className="mx-auto max-w-[1180px] px-4 pt-5 sm:px-6 lg:px-8 lg:pt-[30px]">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <StudioStatCard key={stat.key} stat={stat} />
            ))}
          </div>
        </section>

        {/* Automated pipeline */}
        <section className="mx-auto max-w-[1180px] px-4 pt-7 sm:px-6 lg:px-8 lg:pt-10">
          <div className="mb-3.5 text-xs font-bold uppercase tracking-[0.12em] text-white/45">
            Pipeline
          </div>
          <div className="flex flex-wrap items-stretch gap-2.5">
            {PIPELINE.map((step) => (
              <PipelineStepCard key={step.step} step={step} />
            ))}
          </div>
        </section>

        {/* Topic ideas (AEO/SEO/GEO) */}
        <TopicIdeas onPick={handlePickTopic} />

        {/* Two-column: draft form + content queue */}
        <section className="mx-auto flex max-w-[1180px] flex-wrap items-start gap-[18px] px-4 pb-12 pt-7 sm:px-6 lg:px-8 lg:pb-[90px] lg:pt-10">
          <NewDraftForm topic={topic} setTopic={setTopic} keywords={keywords} setKeywords={setKeywords} />

          <div className="min-w-[300px] flex-[2_1_420px] rounded-[18px] border border-white/10 bg-white/[0.04] p-2">
            <div className="flex items-center justify-between px-4 pb-3 pt-3.5">
              <h2 className="font-display text-[17px] font-bold text-white">
                Content queue
              </h2>
              {queueQuery.data && (
                <span className="text-xs text-white/45">
                  {waiting} to review · {publishedFromStudio} published
                </span>
              )}
            </div>

            {queueQuery.isPending && <p className="px-4 pb-4 text-[13px] text-white/45">Loading…</p>}
            {queueQuery.isError && (
              <p className="px-4 pb-4 text-[13px] text-accent">
                Couldn't load the queue: {(queueQuery.error as Error).message}
              </p>
            )}
            {queueQuery.data?.length === 0 && (
              <p className="px-4 pb-4 text-[13px] text-white/45">No AI drafts yet. Generate one on the left.</p>
            )}

            <div>
              {queue.map((job) => (
                <QueueRow key={job.id} job={job} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
