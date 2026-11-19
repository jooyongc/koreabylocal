// Shared types for the AI Content Studio admin page.
import type { ReactNode } from "react";

export interface StudioStat {
  key: string;
  value: string;
  delta: string;
  /** Tailwind text color class for the delta line */
  deltaClass: string;
}

export interface PipelineStep {
  step: string;
  title: string;
  description: string;
  /** Lucide icon element rendered inside the step badge */
  icon: ReactNode;
}

/** One generated draft, with the state of the blog post it became. */
export interface QueueJob {
  id: number;
  topic: string;
  category: string | null;
  word_count: number;
  links_count: number;
  generated_title: string | null;
  blog_post_id: number | null;
  /** The blog post, or null when it was deleted. Its status is the real one. */
  post: { status: string } | null;
}

/** content_jobs.status is set once at generation; the blog post's status is what's true now. */
export const isPublished = (job: QueueJob) => job.post?.status === "published";
