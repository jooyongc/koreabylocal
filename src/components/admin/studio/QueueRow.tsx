import { ChevronRight } from "lucide-react";
import type { ContentJob } from "./types";

// Map the DB status enum to a display label + badge background color.
const STATUS_META: Record<string, { label: string; bg: string }> = {
  draft: { label: "AI draft", bg: "#F2B705" },
  review: { label: "In review", bg: "#5B2BFF" },
  ready: { label: "Ready", bg: "#0E8C6A" },
  scheduled: { label: "Scheduled", bg: "#FF2D78" },
  published: { label: "Published", bg: "#8a8676" },
};

function statusMeta(status: string) {
  return STATUS_META[status] ?? { label: status, bg: "#8a8676" };
}

export default function QueueRow({ job }: { job: ContentJob }) {
  const title = job.generated_title || job.topic;
  const meta = statusMeta(job.status);
  const wordCount = new Intl.NumberFormat("en-US").format(job.word_count);

  return (
    <div className="flex items-center gap-3 border-t border-white/[0.07] px-4 py-[13px] first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold leading-tight text-white">
          {title}
        </div>
        <div className="mt-1 text-[11.5px] text-white/45">
          {job.category ?? "Uncategorized"} &middot; {wordCount} words &middot;{" "}
          {job.links_count} product links
        </div>
      </div>
      <span
        className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
        style={{ backgroundColor: meta.bg }}
      >
        {meta.label}
      </span>
      <ChevronRight className="h-[18px] w-[18px] shrink-0 text-white/35" />
    </div>
  );
}
