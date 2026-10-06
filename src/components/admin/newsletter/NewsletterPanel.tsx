import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { Loader2, Plus, Send, Trash2, Pencil, PlayCircle, FlaskConical, ArrowLeft } from "lucide-react";
import RichTextEditor from "@/components/admin/common/RichTextEditor";
import {
  sendNewsletterBatch,
  sendTestNewsletter,
  useActiveSubscriberCount,
  useDeleteCampaign,
  useNewsletterCampaigns,
  useSaveCampaign,
  type NewsletterCampaign,
} from "@/hooks/useNewsletterCampaigns";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  sending: "bg-amber-100 text-amber-700",
  sent: "bg-emerald-100 text-emerald-700",
};

interface Progress {
  campaignId: number;
  sent: number;
  total: number;
  note?: string;
}

const isBlank = (html: string) => !html.replace(/<[^>]*>/g, "").trim();

/**
 * Write a newsletter and send it to every active subscriber. Sending runs in
 * batches (send-newsletter) and this loops until the queue is empty or the
 * day's Gmail allowance runs out — a stopped campaign shows "Continue".
 */
export default function NewsletterPanel() {
  const qc = useQueryClient();
  const { data: campaigns, isLoading } = useNewsletterCampaigns();
  const { data: activeCount } = useActiveSubscriberCount();
  const deleteCampaign = useDeleteCampaign();
  const [editing, setEditing] = useState<NewsletterCampaign | "new" | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);

  const runSend = async (campaign: NewsletterCampaign) => {
    setEditing(null);
    let total = campaign.recipient_count || activeCount || 0;
    setProgress({ campaignId: campaign.id, sent: campaign.sent_count, total });
    try {
      for (;;) {
        const r = await sendNewsletterBatch(campaign.id);
        total = r.sent_total + r.failed_total + r.pending;
        setProgress({ campaignId: campaign.id, sent: r.sent_total, total });
        if (r.done) {
          toast.success(`Sent to ${r.sent_total} subscriber${r.sent_total === 1 ? "" : "s"}${r.failed_total ? ` · ${r.failed_total} failed` : ""}`);
          break;
        }
        if (r.stopped) {
          toast(
            `Paused at today's sending limit — ${r.sent_total} sent, ${r.pending} waiting. Press Continue tomorrow.`,
            { icon: "⏸️", duration: 8000 },
          );
          break;
        }
      }
    } catch (err) {
      toast.error(`Sending stopped: ${err instanceof Error ? err.message : "unknown error"} — press Continue to resume.`);
    } finally {
      setProgress(null);
      qc.invalidateQueries({ queryKey: ["admin-newsletter-campaigns"] });
    }
  };

  if (editing) {
    return (
      <Composer
        campaign={editing === "new" ? null : editing}
        activeCount={activeCount ?? 0}
        onBack={() => setEditing(null)}
        onSend={runSend}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">
          Goes to every <strong className="text-primary">active</strong> subscriber —{" "}
          {activeCount ?? "…"} right now. Each email carries its own unsubscribe link.
        </p>
        <button
          onClick={() => setEditing("new")}
          disabled={!!progress}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> New newsletter
        </button>
      </div>

      {progress && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending… {progress.sent} / {progress.total} — keep this tab open.
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-amber-100">
            <div
              className="h-full bg-amber-500 transition-all"
              style={{ width: `${progress.total ? Math.round((progress.sent / progress.total) * 100) : 0}%` }}
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500">Subject</th>
              <th className="px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 font-medium text-gray-500">Sent</th>
              <th className="px-4 py-3 font-medium text-gray-500">Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
            )}
            {(campaigns ?? []).map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="max-w-[340px] truncate px-4 py-3 font-medium text-primary">{c.subject}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[c.status] ?? STATUS_STYLES.draft}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                  {c.status === "draft" ? "—" : `${c.sent_count} / ${c.recipient_count}`}
                  {c.failed_count > 0 && <span className="ml-1.5 text-red-600">· {c.failed_count} failed</span>}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-400">
                  {format(new Date(c.sent_at ?? c.started_at ?? c.created_at), "yyyy-MM-dd HH:mm")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    {c.status === "draft" && (
                      <>
                        <button onClick={() => setEditing(c)} disabled={!!progress} title="Edit" className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteCampaign.mutate(c.id, { onError: () => toast.error("Could not delete") })}
                          disabled={!!progress}
                          title="Delete draft"
                          className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    {c.status === "sending" && (
                      <button
                        onClick={() => runSend(c)}
                        disabled={!!progress}
                        className="flex items-center gap-1.5 rounded-lg border border-amber-300 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-40"
                      >
                        <PlayCircle className="h-3.5 w-3.5" /> Continue
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && (campaigns ?? []).length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">No newsletters yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Composer({
  campaign,
  activeCount,
  onBack,
  onSend,
}: {
  campaign: NewsletterCampaign | null;
  activeCount: number;
  onBack: () => void;
  onSend: (c: NewsletterCampaign) => void;
}) {
  const save = useSaveCampaign();
  const [id, setId] = useState<number | null>(campaign?.id ?? null);
  const [subject, setSubject] = useState(campaign?.subject ?? "");
  const [preheader, setPreheader] = useState(campaign?.preheader ?? "");
  const [body, setBody] = useState(campaign?.body_html ?? "");
  const [testing, setTesting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const ready = subject.trim().length > 0 && !isBlank(body);

  const persist = async (): Promise<NewsletterCampaign> => {
    const saved = await save.mutateAsync({ id, draft: { subject, preheader, body_html: body } });
    setId(saved.id);
    return saved;
  };

  const onSave = async () => {
    try {
      await persist();
      toast.success("Draft saved");
    } catch {
      toast.error("Could not save the draft");
    }
  };

  const onTest = async () => {
    setTesting(true);
    try {
      const saved = await persist();
      const to = await sendTestNewsletter(saved.id);
      toast.success(`Test sent to ${to}`);
    } catch (err) {
      toast.error(`Test failed: ${err instanceof Error ? err.message : "unknown error"}`);
    } finally {
      setTesting(false);
    }
  };

  const onConfirmSend = async () => {
    try {
      const saved = await persist();
      onSend(saved);
    } catch {
      toast.error("Could not save before sending");
    }
  };

  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> All newsletters
      </button>

      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Cherry blossom season is here 🌸" className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Preview text <span className="font-normal text-gray-400">(shown after the subject in the inbox)</span>
          </label>
          <input value={preheader} onChange={(e) => setPreheader(e.target.value)} placeholder="Where locals actually go, and when" className={inputCls} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Body</label>
          <div className="rounded-lg border border-gray-200 p-3">
            <RichTextEditor value={body} onChange={setBody} placeholder="Write the newsletter..." htmlRows={14} />
          </div>
          <p className="mt-2 text-xs text-gray-400">
            The Korea by Local header, footer and each reader's unsubscribe link are added automatically.
          </p>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button onClick={onSave} disabled={save.isPending || !subject.trim()} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
          Save draft
        </button>
        <button onClick={onTest} disabled={!ready || testing} className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
          {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
          Send test to me
        </button>
        {confirming ? (
          <>
            <span className="text-sm text-gray-600">Send to {activeCount} subscribers now?</span>
            <button onClick={() => setConfirming(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100">
              Cancel
            </button>
            <button onClick={onConfirmSend} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
              <Send className="h-4 w-4" /> Yes, send
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            disabled={!ready || activeCount === 0}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" /> Send to {activeCount} subscribers
          </button>
        )}
      </div>
    </div>
  );
}
