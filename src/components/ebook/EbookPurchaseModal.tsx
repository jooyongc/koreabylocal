import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import PayPalCheckoutButtons from "@/components/common/PayPalCheckoutButtons";

interface EbookPurchaseModalProps {
  ebookId: number;
  title: string;
  priceUsd: number;
  onClose: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Collects an email, then hands off to PayPal — the actual purchase is only recorded once verify-ebook-order confirms the capture server-side. */
export default function EbookPurchaseModal({ ebookId, title, priceUsd, onClose }: EbookPurchaseModalProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [verifying, setVerifying] = useState(false);
  const emailValid = EMAIL_RE.test(email.trim());

  const handleApproved = async (paypalOrderId: string) => {
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-ebook-order", {
        body: { ebook_id: ebookId, paypal_order_id: paypalOrderId, email: email.trim() },
      });
      if (error || !data?.download_token) throw error ?? new Error("verification_failed");
      navigate(`/ebook/success?token=${data.download_token}`);
    } catch {
      toast.error("Payment received, but confirming it failed — email info@koreabylocal.com and we'll sort it out.");
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={verifying ? undefined : onClose}>
      <div
        className="w-full max-w-[420px] rounded-[20px] bg-white p-[clamp(24px,4vw,32px)] shadow-[0_30px_70px_rgba(26,26,26,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h3 className="font-display text-[20px] font-extrabold text-ink">Get the e-book</h3>
          {!verifying && (
            <button onClick={onClose} aria-label="Close" className="text-muted-2 hover:text-ink">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <p className="mt-2 text-[14px] text-muted">
          {title} — <span className="font-bold text-ink">${priceUsd.toFixed(2)}</span>
        </p>

        {verifying ? (
          <div className="mt-6 flex flex-col items-center gap-3 py-6 text-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p className="text-[14px] text-muted">Confirming your payment…</p>
          </div>
        ) : (
          <>
            <label htmlFor="ebook-buyer-email" className="mt-5 block text-[13px] font-semibold text-ink">
              Where should we send your download link?
            </label>
            <input
              id="ebook-buyer-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="mt-1.5 w-full rounded-[13px] border border-ink/12 px-[16px] py-[12px] text-[15px] text-ink outline-none placeholder:text-muted-3"
            />
            <div className="mt-4">
              {emailValid ? (
                <PayPalCheckoutButtons
                  amount={priceUsd}
                  description={title}
                  onApproved={handleApproved}
                  onError={() => toast.error("PayPal payment failed. Please try again.")}
                />
              ) : (
                <p className="rounded-[13px] bg-paper py-4 text-center text-[13.5px] text-muted-2">
                  Enter your email above to continue to PayPal.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
