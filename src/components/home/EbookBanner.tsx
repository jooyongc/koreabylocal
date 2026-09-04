import { useState } from "react";
import { Link } from "react-router-dom";
import { X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useEbooks } from "@/hooks/useEbooks";
import { supabase } from "@/lib/supabase";

export default function EbookBanner() {
  const { data: ebooks } = useEbooks();
  const [showSample, setShowSample] = useState(false);
  const cover = ebooks?.[0]?.cover_image_url;

  return (
    <section className="mx-auto max-w-[1180px] px-4 py-[clamp(28px,4vw,44px)] sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 items-center gap-[clamp(24px,4vw,44px)] overflow-hidden rounded-[24px] bg-accent-light p-[clamp(26px,4vw,48px)] lg:grid-cols-[1fr_1.4fr]">
        <div className="flex justify-center">
          {cover ? (
            <img src={cover} alt="Korea By Local e-book" className="w-full max-w-[240px] rounded-xl shadow-[0_20px_44px_rgba(232,75,42,0.2)]" />
          ) : (
            <div className="flex aspect-[3/4] w-full max-w-[220px] rotate-[-3deg] items-center justify-center rounded-xl bg-white shadow-[0_20px_44px_rgba(232,75,42,0.2)]">
              <span className="px-6 text-center font-display text-[15px] font-extrabold text-accent-dark">
                The Ultimate Korea Travel Guide
              </span>
            </div>
          )}
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent-dark">E-book</span>
          <h2 className="mt-2 font-display text-[clamp(24px,3.2vw,36px)] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink">
            The Ultimate Korea Travel Guide
          </h2>
          <p className="mt-3 max-w-[46ch] text-[15px] leading-[1.6] text-muted">
            Everything you need — from hidden spots to transport hacks.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/ebook"
              className="rounded-[13px] bg-accent px-7 py-3.5 text-[14.5px] font-bold text-white transition-opacity hover:opacity-90"
            >
              Buy Now — $12.99
            </Link>
            <button
              onClick={() => setShowSample(true)}
              className="rounded-[13px] border border-accent-dark/30 bg-white px-7 py-3.5 text-[14.5px] font-bold text-accent-dark transition-colors hover:border-accent-dark/60"
            >
              Free Sample
            </button>
          </div>
        </div>
      </div>

      {showSample && <FreeSampleModal onClose={() => setShowSample(false)} />}
    </section>
  );
}

function FreeSampleModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    const { error } = await supabase.from("subscribers").insert({
      email: email.trim(),
      source: "ebook_banner",
      lead_magnet: "ebook_sample",
    });
    setSubmitting(false);
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      toast.error("Something went wrong — please try again.");
      return;
    }
    toast.success("Check your inbox — your free sample is on the way!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-[420px] rounded-[20px] bg-white p-[clamp(24px,4vw,32px)] shadow-[0_30px_70px_rgba(26,26,26,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h3 className="font-display text-[20px] font-extrabold text-ink">Get a free sample</h3>
          <button onClick={onClose} aria-label="Close" className="text-muted-2 hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-[14px] text-muted">
          We'll send a preview chapter of the e-book straight to your inbox.
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
            Send my sample
          </button>
        </form>
      </div>
    </div>
  );
}
