import { useState } from "react";
import OptimizedImage from "@/components/common/OptimizedImage";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useEbooks } from "@/hooks/useEbooks";
import { supabase } from "@/lib/supabase";
import EmailCaptureModal from "@/components/ebook/EmailCaptureModal";

const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

export default function EbookBanner() {
  const { data: ebooks } = useEbooks();
  const ebook = ebooks?.[0];
  const navigate = useNavigate();
  const [showSample, setShowSample] = useState(false);
  const [showFree, setShowFree] = useState(false);

  if (!ebook) return null;
  const isFree = Number(ebook.price_usd) === 0;

  // Mirrors EbookPage's claim-free-ebook call — kept in sync with it.
  const claimFree = async (email: string) => {
    const { data, error } = await supabase.functions.invoke("claim-free-ebook", {
      body: { ebook_id: ebook.id, email },
    });
    if (error || !data?.download_token) {
      toast.error("Couldn't get your copy. Please try again.");
      return false;
    }
    toast.success("Your download is starting — we've emailed you the link too.");
    navigate(`/ebook/download/${data.download_token}`);
    return true;
  };

  return (
    <section className="mx-auto max-w-[1180px] px-4 pb-[clamp(24px,4vw,40px)] sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 items-center gap-[clamp(24px,4vw,44px)] overflow-hidden rounded-[20px] border-[1.5px] border-ink bg-accent-light p-[clamp(26px,4vw,48px)] lg:grid-cols-[1fr_1.4fr]">
        <div className="flex justify-center">
          {ebook.cover_image_url ? (
            <OptimizedImage src={ebook.cover_image_url} alt={ebook.title} preset="thumbnail" className="w-full max-w-[240px] rounded-xl shadow-[0_20px_44px_rgba(255,46,151,0.2)]" />
          ) : (
            <div className="flex aspect-[3/4] w-full max-w-[220px] rotate-[-3deg] items-center justify-center rounded-xl bg-white shadow-[0_20px_44px_rgba(255,46,151,0.2)]">
              <span className="px-6 text-center font-display text-[15px] font-extrabold text-accent-dark">
                {ebook.title}
              </span>
            </div>
          )}
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent-dark">E-book</span>
          <h2 className="mt-2 font-display text-[clamp(24px,3.2vw,36px)] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink">
            {ebook.title}
          </h2>
          <p className="mt-3 max-w-[46ch] text-[15px] leading-[1.6] text-muted">
            {ebook.description ?? "Everything you need — from hidden spots to transport hacks."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {isFree ? (
              <button
                onClick={() => setShowFree(true)}
                className="rounded-[13px] bg-accent px-7 py-3.5 text-[14.5px] font-bold text-white transition-opacity hover:opacity-90"
              >
                Download free
              </button>
            ) : (
              <>
                <Link
                  to="/ebook"
                  className="rounded-[13px] bg-accent px-7 py-3.5 text-[14.5px] font-bold text-white transition-opacity hover:opacity-90"
                >
                  Buy Now — {money(Number(ebook.price_usd))}
                </Link>
                <button
                  onClick={() => setShowSample(true)}
                  className="rounded-[13px] border border-accent-dark/30 bg-white px-7 py-3.5 text-[14.5px] font-bold text-accent-dark transition-colors hover:border-accent-dark/60"
                >
                  Free Sample
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showFree && (
        <EmailCaptureModal
          title="Get your free copy"
          description="Enter your email and the download starts right away. We'll email you the link too."
          source="ebook_banner"
          leadMagnet="free_ebook"
          submitLabel="Download free"
          onSubmitEmail={claimFree}
          onClose={() => setShowFree(false)}
        />
      )}

      {showSample && (
        <EmailCaptureModal
          title="Get a free sample"
          description="We'll send a preview chapter of the e-book straight to your inbox."
          source="ebook_banner"
          leadMagnet="ebook_sample"
          successMessage="Check your inbox — your free sample is on the way!"
          onClose={() => setShowSample(false)}
        />
      )}
    </section>
  );
}
