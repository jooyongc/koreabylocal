import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Sparkles, Target, PenLine, Link2, Share2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import PageSEO from "@/components/common/PageSEO";
import StudioStatCard from "@/components/admin/studio/StudioStatCard";
import PipelineStepCard from "@/components/admin/studio/PipelineStepCard";
import QueueRow from "@/components/admin/studio/QueueRow";
import NewDraftForm from "@/components/admin/studio/NewDraftForm";
import TopicIdeas from "@/components/admin/studio/TopicIdeas";
import type {
  ContentJob,
  PipelineStep,
  StudioStat,
} from "@/components/admin/studio/types";

// ── Static design data (stats + pipeline are illustrative, not in the DB) ──
const STUDIO_STATS: StudioStat[] = [
  {
    key: "Published articles",
    value: "1,284",
    delta: "+38 this week",
    deltaClass: "text-green",
  },
  {
    key: "Organic sessions",
    value: "412k",
    delta: "+22% MoM",
    deltaClass: "text-purple",
  },
  {
    key: "AI drafts in queue",
    value: "47",
    delta: "12 ready to review",
    deltaClass: "text-gold",
  },
  {
    key: "Affiliate revenue",
    value: "$28.6k",
    delta: "+15% MoM",
    deltaClass: "text-accent",
  },
];

const PIPELINE: PipelineStep[] = [
  {
    step: "1",
    title: "Topic & keyword",
    description: "GSC + trend gaps",
    icon: <Target className="h-3.5 w-3.5" />,
  },
  {
    step: "2",
    title: "AI draft",
    description: "Claude writes + cites",
    icon: <Sparkles className="h-3.5 w-3.5" />,
  },
  {
    step: "3",
    title: "Human review",
    description: "Local host edits",
    icon: <PenLine className="h-3.5 w-3.5" />,
  },
  {
    step: "4",
    title: "Auto-link",
    description: "Experiences + Shop",
    icon: <Link2 className="h-3.5 w-3.5" />,
  },
  {
    step: "5",
    title: "Publish + schema",
    description: "FAQ/Article JSON-LD",
    icon: <Share2 className="h-3.5 w-3.5" />,
  },
];

// Fallback queue mirrors the design when the table is empty / unavailable.
const FALLBACK_QUEUE: ContentJob[] = [
  {
    id: -1,
    topic: "The 7 best day trips from Seoul by train",
    keywords: [],
    tone: "informative",
    status: "draft",
    category: "Itinerary",
    word_count: 1840,
    links_count: 6,
    model: null,
    generated_title: null,
    generated_body: null,
    blog_post_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: -2,
    topic: "Where locals actually eat in Gwangjang Market",
    keywords: [],
    tone: "editorial",
    status: "review",
    category: "Food",
    word_count: 1210,
    links_count: 4,
    model: null,
    generated_title: null,
    generated_body: null,
    blog_post_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: -3,
    topic: "Jeju vs Busan: which coast is for you?",
    keywords: [],
    tone: "editorial",
    status: "ready",
    category: "Guide",
    word_count: 2030,
    links_count: 8,
    model: null,
    generated_title: null,
    generated_body: null,
    blog_post_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: -4,
    topic: "A first-timer's guide to Korean transfers",
    keywords: [],
    tone: "informative",
    status: "scheduled",
    category: "Transfers",
    word_count: 1560,
    links_count: 5,
    model: null,
    generated_title: null,
    generated_body: null,
    blog_post_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: -5,
    topic: "Hanbok rental etiquette, explained",
    keywords: [],
    tone: "informative",
    status: "published",
    category: "Culture",
    word_count: 940,
    links_count: 3,
    model: null,
    generated_title: null,
    generated_body: null,
    blog_post_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// `content_jobs` is not in the generated Supabase types yet; query via a
// loosely-typed view of the client so this compiles under strict mode.
async function fetchContentJobs(): Promise<ContentJob[]> {
  const { data, error } = await (supabase as unknown as {
    from: (table: string) => {
      select: (cols: string) => {
        order: (
          col: string,
          opts: { ascending: boolean },
        ) => Promise<{ data: ContentJob[] | null; error: unknown }>;
      };
    };
  })
    .from("content_jobs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export default function ContentStudioPage() {
  const { data, isError } = useQuery<ContentJob[]>({
    queryKey: ["admin", "content-jobs"],
    queryFn: fetchContentJobs,
    staleTime: 30_000,
    // Never surface the table-missing case as a hard failure: fall back below.
    retry: false,
  });

  // Use real rows when present, otherwise the design's placeholder data.
  const queue = data && data.length > 0 ? data : FALLBACK_QUEUE;
  const usingFallback = isError || !data || data.length === 0;

  const readyCount = queue.filter((j) => j.status === "ready").length;
  const queueSummary = `${queue.length} draft${
    queue.length === 1 ? "" : "s"
  } · ${readyCount} ready`;

  const [topic, setTopic] = useState("Best day trips from Seoul by train");
  const [keywords, setKeywords] = useState<string[]>(["seoul day trips", "ktx from seoul"]);

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
                  AI · AUTOMATED
                </span>
              </div>
              <p className="mt-1.5 text-[13px] text-white/50">
                Admin · SEO/AEO content pipeline for koreabylocal.com
              </p>
            </div>
            <button
              type="button"
              onClick={focusDraftForm}
              className="flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(255,45,120,0.3)] transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <Sparkles className="h-4 w-4" />
              Generate new article
            </button>
          </div>
        </section>

        {/* Stats row */}
        <section className="mx-auto max-w-[1180px] px-4 pt-5 sm:px-6 lg:px-8 lg:pt-[30px]">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {STUDIO_STATS.map((stat) => (
              <StudioStatCard key={stat.key} stat={stat} />
            ))}
          </div>
        </section>

        {/* Automated pipeline */}
        <section className="mx-auto max-w-[1180px] px-4 pt-7 sm:px-6 lg:px-8 lg:pt-10">
          <div className="mb-3.5 text-xs font-bold uppercase tracking-[0.12em] text-white/45">
            Automated pipeline
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
              <span className="text-xs text-white/45">{queueSummary}</span>
            </div>

            {usingFallback && (
              <p className="px-4 pb-2 text-[11px] text-white/35">
                Showing sample data — connect the content pipeline to see live
                drafts.
              </p>
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
