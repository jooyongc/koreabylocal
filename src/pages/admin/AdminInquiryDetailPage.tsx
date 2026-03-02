import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Send, Paperclip, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useAdminInquiry, useReplyInquiry } from "@/hooks/useAdminInquiry";
import toast from "react-hot-toast";

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
      await replyMutation.mutateAsync({ id: inquiry.id, reply });
      toast.success("Reply saved, marked as replied");
    } catch {
      toast.error("Failed to save reply");
    }
  };

  const existingReply = inquiry.admin_reply ?? "";
  const isReplied = inquiry.status === "replied";

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

          {/* Reply Section */}
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-primary">Admin Reply</h2>

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
              {isReplied ? "Update Reply" : "Send Reply"}
            </button>
          </section>
        </div>
      </div>
    </>
  );
}
