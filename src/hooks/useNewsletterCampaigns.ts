import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";

export type NewsletterCampaign = Tables<"newsletter_campaigns">;

export interface CampaignDraft {
  subject: string;
  preheader: string;
  body_html: string;
}

/** What send-newsletter answers for one batch. */
export interface SendBatchResult {
  done: boolean;
  sent_now: number;
  failed_now: number;
  pending: number;
  sent_total: number;
  failed_total: number;
  stopped: "daily_limit" | "gmail_limit" | null;
  daily_remaining: number;
}

export function useNewsletterCampaigns() {
  return useQuery({
    queryKey: ["admin-newsletter-campaigns"],
    queryFn: async (): Promise<NewsletterCampaign[]> => {
      const { data, error } = await supabase
        .from("newsletter_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useActiveSubscriberCount() {
  return useQuery({
    queryKey: ["admin-subscriber-active-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("subscribers")
        .select("id", { count: "exact", head: true })
        .eq("status", "active");
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useSaveCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, draft }: { id: number | null; draft: CampaignDraft }) => {
      const row = { subject: draft.subject.trim(), preheader: draft.preheader.trim() || null, body_html: draft.body_html };
      const { data, error } = id
        ? await supabase.from("newsletter_campaigns").update(row).eq("id", id).eq("status", "draft").select("*").single()
        : await supabase.from("newsletter_campaigns").insert(row).select("*").single();
      if (error) throw error;
      return data as NewsletterCampaign;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-newsletter-campaigns"] }),
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("newsletter_campaigns").delete().eq("id", id).eq("status", "draft");
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-newsletter-campaigns"] }),
  });
}

/** Pulls the error message out of a functions.invoke failure (the body carries it). */
async function invokeError(error: unknown): Promise<string> {
  const ctx = (error as { context?: Response })?.context;
  if (ctx && typeof ctx.json === "function") {
    try {
      const body = await ctx.json();
      if (body?.error) return String(body.error);
    } catch {
      // fall through
    }
  }
  return error instanceof Error ? error.message : "request_failed";
}

export async function sendTestNewsletter(campaignId: number): Promise<string> {
  const { data, error } = await supabase.functions.invoke("send-newsletter", {
    body: { action: "test", campaign_id: campaignId },
  });
  if (error) throw new Error(await invokeError(error));
  return (data as { to: string }).to;
}

export async function sendNewsletterBatch(campaignId: number): Promise<SendBatchResult> {
  const { data, error } = await supabase.functions.invoke("send-newsletter", {
    body: { action: "send", campaign_id: campaignId },
  });
  if (error) throw new Error(await invokeError(error));
  return data as SendBatchResult;
}
