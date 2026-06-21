// Shared types for the AI Content Studio admin page.
// `content_jobs` is not present in the generated Supabase types yet, so we
// define a local row shape that mirrors the table's columns.

export type ContentJobStatus =
  | "draft"
  | "review"
  | "ready"
  | "scheduled"
  | "published";

export interface ContentJob {
  id: number;
  topic: string;
  keywords: string[];
  tone: string;
  status: ContentJobStatus | string;
  category: string | null;
  word_count: number;
  links_count: number;
  model: string | null;
  generated_title: string | null;
  generated_body: string | null;
  blog_post_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface StudioStat {
  key: string;
  value: string;
  delta: string;
  /** Tailwind text-color class for the delta line. */
  deltaClass: string;
}

export interface PipelineStep {
  step: string;
  title: string;
  description: string;
  /** lucide icon node */
  icon: React.ReactNode;
}
