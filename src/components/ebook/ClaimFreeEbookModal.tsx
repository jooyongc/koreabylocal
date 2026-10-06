import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

interface ClaimFreeEbookModalProps {
  ebookId: number;
  title: string;
  onClose: () => void;
}

/** Email-capture modal for a $0 e-book — delivers it immediately, no payment step. */
export default function ClaimFreeEbookModal({ ebookId, title, onClose }: ClaimFreeEbookModalProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("claim-free-ebook", {
      body: { ebook_id: ebookId, email: email.trim() },
    });
    setSubmitting(false);
    if (error || !data?.download_token) {
      toast.error("Something went wrong — please try again.");
      return;
    }
    toast.success("It's yours! We also emailed you the link.");
    onClose();
    navigate(`/ebook/download/${data.download_token}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-[420px] rounded-[20px] bg-white p-[clamp(24px,4vw,32px)] shadow-[0_30px_70px_rgba(26,26,26,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h3 className="font-display text-[20px] font-extrabold text-ink">Get it free</h3>
          <button onClick={onClose} aria-label="Close" className="text-muted-2 hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-[14px] text-muted">
          Enter your email and we'll unlock <strong>{title}</strong> for download right away.
        </p>
        <form onSubmit={submit} className="mt-5 flex flex-col gap-2.5">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="rounded-[13px] border border-ink/12 px-[16px] py-[12px] text-[15px] text-ink outline-none placeholder:text-muted-3"
          />
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-[13px] bg-accent py-[12px] text-[15px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Get my free copy
          </button>
        </form>
      </div>
    </div>
  );
}
