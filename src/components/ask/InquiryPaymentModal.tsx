import { useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import PayPalCheckoutButtons from "@/components/common/PayPalCheckoutButtons";

export interface PendingInquiry {
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
}

interface InquiryPaymentModalProps {
  inquiry: PendingInquiry;
  attachmentUrl: string;
  onClose: () => void;
  onSuccess: () => void;
}

const QUESTION_PRICE_USD = 1;

/** Shown once the question form is valid. The question is only saved once verify-inquiry-order confirms the $1 payment server-side. */
export default function InquiryPaymentModal({ inquiry, attachmentUrl, onClose, onSuccess }: InquiryPaymentModalProps) {
  const [verifying, setVerifying] = useState(false);

  const handleApproved = async (paypalOrderId: string) => {
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-inquiry-order", {
        body: {
          ...inquiry,
          subject: inquiry.subject || null,
          attachment_url: attachmentUrl || null,
          paypal_order_id: paypalOrderId,
        },
      });
      if (error || !data?.success) throw error ?? new Error("verification_failed");
      onSuccess();
    } catch {
      toast.error("Payment received, but saving your question failed — email info@koreabylocal.com and we'll sort it out.");
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
          <h3 className="font-display text-[20px] font-extrabold text-ink">Pay $1 to send your question</h3>
          {!verifying && (
            <button onClick={onClose} aria-label="Close" className="text-muted-2 hover:text-ink">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <p className="mt-2 line-clamp-2 text-[14px] text-muted">“{inquiry.message}”</p>

        {verifying ? (
          <div className="mt-6 flex flex-col items-center gap-3 py-6 text-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p className="text-[14px] text-muted">Confirming your payment…</p>
          </div>
        ) : (
          <div className="mt-5">
            <PayPalCheckoutButtons
              amount={QUESTION_PRICE_USD}
              description="Ask a Local — one question"
              onApproved={handleApproved}
              onError={() => toast.error("PayPal payment failed. Please try again.")}
            />
          </div>
        )}
      </div>
    </div>
  );
}
