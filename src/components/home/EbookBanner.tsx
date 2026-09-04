import { useState } from "react";
import { Link } from "react-router-dom";
import { useEbooks } from "@/hooks/useEbooks";
import EmailCaptureModal from "@/components/ebook/EmailCaptureModal";

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
