import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { isPublished, type QueueJob } from "./types";

function badge(job: QueueJob) {
  if (!job.post) return { label: "Post deleted", bgClass: "bg-muted-2" };
  if (isPublished(job)) return { label: "Published", bgClass: "bg-muted-2" };
  return { label: "To review", bgClass: "bg-green" };
}

export default function QueueRow({ job }: { job: QueueJob }) {
  const meta = badge(job);
  const body = (
    <>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold leading-tight text-white">
          {job.generated_title || job.topic}
        </div>
        <div className="mt-1 text-[11.5px] text-white/45">
          {job.category ?? "Uncategorized"} &middot; {job.word_count.toLocaleString("en-US")} words &middot;{" "}
          {job.links_count} link{job.links_count === 1 ? "" : "s"}
        </div>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold text-white ${meta.bgClass}`}>
        {meta.label}
      </span>
    </>
  );
  const row = "flex items-center gap-3 border-t border-white/[0.07] px-4 py-[13px] first:border-t-0";

  if (!job.blog_post_id || !job.post) return <div className={row}>{body}</div>;
  return (
    <Link to={`/admin/blog/${job.blog_post_id}/edit`} className={`${row} transition-colors hover:bg-white/[0.04]`}>
      {body}
      <ChevronRight className="h-[18px] w-[18px] shrink-0 text-white/35" />
    </Link>
  );
}
