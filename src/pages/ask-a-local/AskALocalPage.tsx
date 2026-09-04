import { useState } from "react";
import { useForm } from "react-hook-form";
import { Send, Upload, X, Loader2, CheckCircle } from "lucide-react";
import PageSEO from "@/components/common/PageSEO";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { uploadImage } from "@/lib/uploadImage";
import RecentlyAnswered from "@/components/ask/RecentlyAnswered";
import TripGenieBanner from "@/components/home/TripGenieBanner";

const CATEGORIES = [
  "General",
  "Tour Inquiry",
  "Transportation",
  "Custom Request",
  "Other",
] as const;

interface InquiryForm {
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
}

export default function AskALocalPage() {
  const [submitted, setSubmitted] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InquiryForm>({
    defaultValues: { category: "General" },
  });

  const handleFileUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      toast.error("Only images and PDFs are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const url = await uploadImage(file, "product-images");
      setAttachmentUrl(url);
      setAttachmentName(file.name);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: InquiryForm) => {
    try {
      const { error } = await supabase.from("inquiries").insert({
        name: data.name,
        email: data.email,
        subject: data.subject || null,
        category: data.category,
        message: data.message,
        attachment_url: attachmentUrl || null,
      });
      if (error) throw error;

      // Trigger email notification (fire and forget)
      supabase.functions
        .invoke("send-inquiry-notification", {
          body: {
            name: data.name,
            email: data.email,
            subject: data.subject,
            category: data.category,
            message: data.message,
          },
        })
        .catch(() => {});

      setSubmitted(true);
    } catch {
      toast.error("Failed to submit inquiry. Please try again.");
    }
  };

  // ── Shared field styling (renewal) ──────────────────────────────
  const fieldClass =
    "w-full rounded-[12px] border border-ink/15 bg-white px-3.5 py-3 text-[15px] text-ink placeholder:text-muted-3 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20";
  const labelClass = "mb-1.5 block text-[13px] font-semibold text-ink";
  const errorClass = "mt-1 text-[12px] text-coral";

  if (submitted) {
    return (
      <>
        <PageSEO
          title="Thank You | Ask a Local | Korea By Local"
          description="Your inquiry has been submitted. We'll get back to you soon."
          path="/ask-a-local"
          noindex
        />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green/10">
            <CheckCircle className="h-8 w-8 text-green" />
          </div>
          <h1 className="font-display text-[clamp(28px,4vw,40px)] font-extrabold tracking-[-0.02em] text-ink">
            Thank you!{" "}
            <span className="font-serif-accent font-medium italic text-accent">
              A local’s on it.
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-[46ch] text-[16px] text-muted">
            Your question has been received. A verified Korean host will reply —
            usually within a few hours.
          </p>
          <a
            href="/"
            className="mt-8 inline-flex items-center justify-center rounded-[12px] bg-accent px-7 py-3.5 text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(255,45,120,0.35)] transition-transform hover:scale-[1.03]"
          >
            Back to home
          </a>
        </div>
      </>
    );
  }

  return (
    <>
      <PageSEO
        title="Ask a Local | Korea By Local"
        description="Have a question about Korea? Ask our local experts for personalized travel recommendations, tips, and custom trip planning."
        path="/ask-a-local"
      />

      {/* ── Hero + form card ───────────────────────────────────────── */}
      <section className="mx-auto max-w-[880px] px-4 pt-[clamp(34px,5vw,72px)] text-center sm:px-6 lg:px-8">
        <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-accent">
          현지인에게 물어보세요
        </p>
        <h1 className="mt-3 font-display text-[clamp(32px,5.5vw,60px)] font-extrabold leading-[1.02] tracking-[-0.02em] text-ink">
          Stuck planning?{" "}
          <span className="font-serif-accent font-medium italic">
            Ask a real local.
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-[50ch] text-[clamp(15px,1.7vw,18px)] text-muted">
          Free, no account needed. A verified Korean host replies — usually
          within a few hours — with honest, specific advice for your trip.
        </p>

        {/* Question form card */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-7 rounded-[20px] bg-white p-[18px] text-left shadow-[0_16px_44px_rgba(16,15,44,0.12)]"
        >
          {/* Message — the prominent "ask" textarea */}
          <div>
            <label htmlFor="ask-message" className="sr-only">
              Your question
            </label>
            <textarea
              id="ask-message"
              {...register("message", { required: "Please write your question" })}
              rows={3}
              className="min-h-[90px] w-full resize-y rounded-[14px] border border-ink/12 bg-white p-4 text-[15px] leading-[1.5] text-ink placeholder:text-muted-3 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="e.g. “4 days in Korea with kids — Seoul + one more city. What would you do?”"
            />
            {errors.message && (
              <p className={errorClass} role="alert">
                {errors.message.message}
              </p>
            )}
          </div>

          {/* Chips row + attachment + submit */}
          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap gap-2">
              {attachmentUrl ? (
                <span className="inline-flex max-w-[220px] items-center gap-1.5 rounded-full bg-paper px-3 py-1.5 text-[12.5px] text-muted-2">
                  <span className="truncate">📎 {attachmentName}</span>
                  <button
                    type="button"
                    aria-label="Remove attachment"
                    onClick={() => {
                      setAttachmentUrl("");
                      setAttachmentName("");
                    }}
                    className="shrink-0 rounded-full p-0.5 text-muted-2 transition-colors hover:text-coral"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ) : (
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-paper px-3 py-1.5 text-[12.5px] text-muted-2 transition-colors hover:bg-cream-200">
                  {uploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  <span>{uploading ? "Uploading…" : "📎 Attach dates"}</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    disabled={uploading}
                  />
                </label>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-paper px-3 py-1.5 text-[12.5px] text-muted-2">
                👥 Group size
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || uploading}
              className="inline-flex items-center gap-2 rounded-[12px] bg-accent px-[26px] py-3.5 text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(255,45,120,0.35)] transition-transform hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isSubmitting ? "Sending…" : "Ask a local →"}
            </button>
          </div>

          {/* Contact + categorisation details */}
          <div className="mt-4 grid grid-cols-1 gap-4 border-t border-ink/10 pt-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ask-name" className={labelClass}>
                Name <span className="text-accent">*</span>
              </label>
              <input
                id="ask-name"
                {...register("name", { required: "Name is required" })}
                className={fieldClass}
                placeholder="Your name"
              />
              {errors.name && (
                <p className={errorClass} role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="ask-email" className={labelClass}>
                Email <span className="text-accent">*</span>
              </label>
              <input
                id="ask-email"
                type="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Invalid email address",
                  },
                })}
                className={fieldClass}
                placeholder="your@email.com"
              />
              {errors.email && (
                <p className={errorClass} role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="ask-subject" className={labelClass}>
                Subject
              </label>
              <input
                id="ask-subject"
                {...register("subject")}
                className={fieldClass}
                placeholder="Brief subject (optional)"
              />
            </div>

            <div>
              <label htmlFor="ask-category" className={labelClass}>
                Category
              </label>
              <select
                id="ask-category"
                {...register("category")}
                className={fieldClass}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>

        {/* Trust row */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1 text-[12.5px] text-muted-2">
          <span>⚡ Avg reply 3h</span>
          <span aria-hidden="true">·</span>
          <span>★ 4.9 helpfulness</span>
          <span aria-hidden="true">·</span>
          <span>✦ 60 verified hosts</span>
        </div>
      </section>

      {/* ── Recently answered ──────────────────────────────────────── */}
      <RecentlyAnswered />

      <TripGenieBanner
        title="Can't find your answer?"
        subtitle="Trip Genie can chat it through with you right now."
        ctaLabel="Chat with Trip Genie"
      />
    </>
  );
}
