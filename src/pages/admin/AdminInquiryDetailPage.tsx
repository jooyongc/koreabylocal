import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Send, Paperclip, ExternalLink, Clock, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { useAdminInquiry, useReplyInquiry } from "@/hooks/useAdminInquiry";
import toast from "react-hot-toast";
import { readTriage, type AiTriage } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  replied: "bg-emerald-100 text-emerald-700",
};

export default function AdminInquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const inquiryId = id ? Number(id) : undefined;
  const { data: inquiry, isLoading, error } = useAdminInquiry(inquiryId);
  const replyMutation = useReplyInquiry();
  const [reply, setReply] = useState("");

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !inquiry) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <p className="text-red-500">Inquiry not found</p>
        <Link to="/admin/inquiries" className="mt-4 text-sm text-primary hover:underline">
          Back to Inquiries
        </Link>
      </div>
    );
  }

  const handleReply = async () => {
    if (!reply.trim()) {
      toast.error("Please enter a reply");
      return;
    }
    try {
      const result = await replyMutation.mutateAsync({ id: inquiry.id, reply });
      toast.success(
        result.recorded
          ? `Reply emailed to ${result.to ?? "the traveler"}`
          : "Reply emailed, but saving it here failed — the traveler has it.",
      );
    } catch (e) {
      // The message says whether anything was sent; never let a failure read as "sent".
      toast.error((e as Error).message, { duration: 6000 });
    }
  };

  const existingReply = inquiry.admin_reply ?? "";
  const isReplied = inquiry.status === "replied";
  const triage = readTriage(inquiry.ai_triage);

  return (
    <>
      <Helmet>
        <title>Inquiry from {inquiry.name} | Korea By Local Admin</title>
      </Helmet>

      <div className="mx-auto max-w-4xl px-4 py-6 lg:px-6 lg:py-8">
        <div className="mb-6">
          <Link
            to="/admin/inquiries"
            className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Inquiries
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-primary">
              Inquiry from {inquiry.name}
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${STATUS_COLORS[inquiry.status] ?? "bg-gray-100 text-gray-500"}`}
            >
              {inquiry.status}
            </span>
            {triage?.urgent && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold uppercase text-rose-700">
                <Clock className="h-3.5 w-3.5" /> Urgent
              </span>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Customer Info */}
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-primary">Customer Info</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <span className="text-xs text-gray-500">Name</span>
                <p className="text-sm font-medium text-gray-800">{inquiry.name}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Email</span>
                <p className="text-sm text-gray-800">{inquiry.email}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Date</span>
                <p className="text-sm text-gray-800">
                  {format(new Date(inquiry.created_at), "yyyy-MM-dd HH:mm")}
                </p>
              </div>
            </div>
          </section>

          {/* Inquiry Content */}
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-primary">Inquiry</h2>
            <div className="space-y-3">
              {inquiry.subject && (
                <div>
                  <span className="text-xs text-gray-500">Subject</span>
                  <p className="text-sm font-medium text-gray-800">{inquiry.subject}</p>
                </div>
              )}
              <div>
                <span className="text-xs text-gray-500">Category</span>
                <p className="text-sm text-gray-800">{inquiry.category}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Message</span>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                  {inquiry.message}
                </p>
              </div>
              {inquiry.attachment_url && (
                <div>
                  <span className="text-xs text-gray-500">Attachment</span>
                  <a
                    href={inquiry.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Paperclip className="h-4 w-4" />
                    View Attachment
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </section>

          {triage && <TriagePanel triage={triage} formCategory={inquiry.category} />}

          {/* Reply Section */}
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-primary">Admin Reply</h2>
            <p className="mb-4 mt-1 text-xs text-gray-500">
              This is emailed to {inquiry.email} and the inquiry is marked replied. If the email
              does not go out, nothing is recorded.
            </p>

            {isReplied && existingReply && (
              <div className="mb-4 rounded-lg bg-emerald-50 p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-emerald-700">Replied</span>
                  {inquiry.replied_at && (
                    <span className="text-xs text-gray-400">
                      {format(new Date(inquiry.replied_at), "yyyy-MM-dd HH:mm")}
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-sm text-gray-700">{existingReply}</p>
              </div>
            )}

            <textarea
              value={reply || existingReply}
              onChange={(e) => setReply(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Write your reply here..."
            />
            <button
              onClick={handleReply}
              disabled={replyMutation.isPending}
              className="mt-3 flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {replyMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {replyMutation.isPending ? "Sending…" : isReplied ? "Send Again" : "Send Reply"}
            </button>
          </section>
        </div>
      </div>
    </>
  );
}

/**
 * What the judgement made of the question, shown before the reply box so it is
 * read while drafting. Everything here is a suggestion the editor overrules —
 * the wording and the visible confidence are meant to keep it that way, and
 * nothing on this panel acts on its own.
 */
function TriagePanel({ triage, formCategory }: { triage: AiTriage; formCategory: string }) {
  const disagrees = triage.category && triage.category.toLowerCase() !== formCategory.toLowerCase();

  return (
    <section className="rounded-xl border border-violet-200 bg-violet-50/60 p-6">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-primary">
        <Sparkles className="h-4 w-4 text-violet-500" />
        AI triage
      </h2>
      <p className="mb-4 text-xs text-gray-500">
        Suggested automatically — check before relying on it.
      </p>

      <div className="space-y-4">
        {triage.urgent && (
          <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm font-medium text-rose-800">
            Looks time-sensitive — the traveler may be arriving within about 48 hours.
          </p>
        )}

        {disagrees && (
          <div>
            <span className="text-xs text-gray-500">Category</span>
            <p className="text-sm text-gray-800">
              Read as <b>{triage.category}</b>
              {triage.category_confidence !== null && (
                <span className="text-gray-400"> ({Math.round(triage.category_confidence * 100)}% confident)</span>
              )}
              <span className="text-gray-400"> — the form said {formCategory}</span>
            </p>
          </div>
        )}

        {triage.related.length > 0 && (
          <div>
            <span className="text-xs text-gray-500">Guides that may already answer this</span>
            <ul className="mt-1 space-y-1">
              {triage.related.map((r) => (
                <li key={r.slug}>
                  <a
                    href={`/guidebook/${r.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    {r.title}
                    <ExternalLink className="h-3 w-3 text-gray-400" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!triage.urgent && !disagrees && triage.related.length === 0 && (
          <p className="text-sm text-gray-500">
            Nothing flagged: not time-sensitive, category agrees, and no existing guide covers it.
          </p>
        )}
      </div>
    </section>
  );
}
