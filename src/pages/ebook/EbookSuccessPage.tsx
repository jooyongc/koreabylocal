import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Download, Mail } from "lucide-react";
import PageSEO from "@/components/common/PageSEO";
import { supabase } from "@/lib/supabase";

interface PurchaseStatus {
  status: "pending" | "completed" | string;
  download_token?: string;
}

const MAX_POLLS = 15; // ~30s at a 2s interval — the webhook usually lands in 1-2s.

export default function EbookSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [pollCount, setPollCount] = useState(0);

  const { data } = useQuery({
    queryKey: ["ebook-purchase", sessionId],
    enabled: !!sessionId,
    queryFn: async (): Promise<PurchaseStatus> => {
      setPollCount((c) => c + 1);
      const { data, error } = await supabase.functions.invoke("get-ebook-purchase", {
        body: { session_id: sessionId },
      });
      if (error) throw error;
      return data as PurchaseStatus;
    },
    // Keeps polling even past the timeout message below — if the webhook lands
    // late, the page still flips over to the download button on its own.
    refetchInterval: (query) => (query.state.data?.status === "completed" ? false : 2000),
  });

  const timedOut = pollCount > MAX_POLLS && data?.status !== "completed";

  if (!sessionId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">Nothing to show here</h1>
        <p className="mt-2 text-muted">This page is only reachable after a checkout.</p>
        <Link to="/ebook" className="mt-6 inline-block font-semibold text-accent">← Back to the e-book</Link>
      </div>
    );
  }

  return (
    <>
      <PageSEO title="Thank you! | Korea By Local" description="Your e-book purchase is confirmed." path="/ebook/success" noindex />

      <div className="mx-auto max-w-[560px] px-4 py-[clamp(48px,8vw,96px)] text-center sm:px-6">
        {data?.status === "completed" ? (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green/10">
              <CheckCircle2 className="h-8 w-8 text-green" />
            </div>
            <h1 className="font-display text-[clamp(28px,4vw,40px)] font-extrabold tracking-[-0.02em] text-ink">
              Thank you! Your guide is ready.
            </h1>
            <p className="mt-3 text-[15px] text-muted">We also sent the link to your email.</p>

            {data.download_token && (
              <Link
                to={`/ebook/download/${data.download_token}`}
                className="mt-8 inline-flex items-center gap-2 rounded-[13px] bg-accent px-8 py-4 text-[15.5px] font-bold text-white transition-opacity hover:opacity-90"
              >
                <Download className="h-[18px] w-[18px]" /> Download your e-book
              </Link>
            )}

            <div className="mt-6">
              <Link to="/" className="text-[14.5px] font-semibold text-accent hover:underline">
                Explore more spots →
              </Link>
            </div>
          </>
        ) : timedOut ? (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent-light">
              <Mail className="h-8 w-8 text-accent-dark" />
            </div>
            <h1 className="font-display text-[26px] font-extrabold text-ink">Almost there</h1>
            <p className="mt-3 text-[15px] text-muted">
              Your payment went through, but confirming it is taking longer than usual. We've sent (or
              will send shortly) your download link by email — check your inbox in a few minutes.
            </p>
            <Link to="/" className="mt-6 inline-block text-[14.5px] font-semibold text-accent hover:underline">
              Back to home →
            </Link>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent" />
            <h1 className="mt-5 font-display text-[22px] font-extrabold text-ink">Confirming your payment…</h1>
            <p className="mt-2 text-[14px] text-muted">This only takes a moment.</p>
          </>
        )}
      </div>
    </>
  );
}
