import { useState } from "react";
import { useForm } from "react-hook-form";
import { Send, Upload, X, Loader2, CheckCircle } from "lucide-react";
import PageSEO from "@/components/common/PageSEO";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { uploadImage } from "@/lib/uploadImage";

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

  if (submitted) {
    return (
      <>
        <PageSEO
          title="Thank You | Ask a Local | Korea By Local"
          description="Your inquiry has been submitted. We'll get back to you soon."
          path="/ask-a-local"
          noindex
        />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-primary">Thank You!</h1>
          <p className="mt-3 text-text-secondary">
            Your inquiry has been received. We'll get back to you within 24 hours.
          </p>
          <a
            href="/"
            className="mt-8 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
          >
            Back to Home
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

      <div className="mx-auto max-w-2xl px-4 py-10 lg:py-16">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary lg:text-4xl">Ask a Local</h1>
          <p className="mt-3 text-text-secondary">
            Have a question about Korea? Get personalized recommendations from our local experts.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:p-8"
        >
          <div className="space-y-5">
            {/* Name & Email - 2 col */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("name", { required: "Name is required" })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Your name"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Invalid email address",
                    },
                  })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Subject & Category - 2 col */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
                <input
                  {...register("subject")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Brief subject (optional)"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                <select
                  {...register("category")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register("message", { required: "Message is required" })}
                rows={6}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Tell us what you need help with..."
              />
              {errors.message && (
                <p className="mt-1 text-xs text-red-500">{errors.message.message}</p>
              )}
            </div>

            {/* File Attachment */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Attachment <span className="text-xs text-gray-400">(optional, image or PDF, max 5MB)</span>
              </label>
              {attachmentUrl ? (
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                  <span className="flex-1 truncate text-sm text-gray-700">{attachmentName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachmentUrl("");
                      setAttachmentName("");
                    }}
                    className="rounded p-1 text-gray-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 transition-colors hover:border-primary/50">
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  ) : (
                    <Upload className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-500">
                    {uploading ? "Uploading..." : "Click to attach a file"}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || uploading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isSubmitting ? "Submitting..." : "Send Inquiry"}
          </button>
        </form>
      </div>
    </>
  );
}
