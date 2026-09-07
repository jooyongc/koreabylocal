import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, Download } from "lucide-react";
import PageSEO from "@/components/common/PageSEO";

/** PayPal verification already happened before we got here (see EbookPurchaseModal), so the download token is ready immediately — no polling needed. */
export default function EbookSuccessPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  if (!token) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">Nothing to show here</h1>
        <p className="mt-2 text-muted">This page is only reachable after a purchase.</p>
        <Link to="/ebook" className="mt-6 inline-block font-semibold text-accent">← Back to the e-book</Link>
      </div>
    );
  }

  return (
    <>
      <PageSEO title="Thank you! | Korea By Local" description="Your e-book purchase is confirmed." path="/ebook/success" noindex />

      <div className="mx-auto max-w-[560px] px-4 py-[clamp(48px,8vw,96px)] text-center sm:px-6">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green/10">
          <CheckCircle2 className="h-8 w-8 text-green" />
        </div>
        <h1 className="font-display text-[clamp(28px,4vw,40px)] font-extrabold tracking-[-0.02em] text-ink">
          Thank you! Your guide is ready.
        </h1>
        <p className="mt-3 text-[15px] text-muted">Keep this link — you can download again if you need to.</p>

        <Link
          to={`/ebook/download/${token}`}
          className="mt-8 inline-flex items-center gap-2 rounded-[13px] bg-accent px-8 py-4 text-[15.5px] font-bold text-white transition-opacity hover:opacity-90"
        >
          <Download className="h-[18px] w-[18px]" /> Download your e-book
        </Link>

        <div className="mt-6">
          <Link to="/" className="text-[14.5px] font-semibold text-accent hover:underline">
            Explore more spots →
          </Link>
        </div>
      </div>
    </>
  );
}
