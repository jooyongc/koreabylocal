import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import PageSEO from "@/components/common/PageSEO";

/** Polar only redirects here after a successful $1 payment; polar-webhook marks the question paid and notifies the team. */
export default function AskSuccessPage() {
  const [searchParams] = useSearchParams();
  const checkoutId = searchParams.get("checkout_id");

  if (!checkoutId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">Nothing to show here</h1>
        <p className="mt-2 text-muted">This page is only reachable after a checkout.</p>
        <Link to="/ask-a-local" className="mt-6 inline-block font-semibold text-accent">
          ← Ask a local
        </Link>
      </div>
    );
  }

  return (
    <>
      <PageSEO
        title="Thank You | Ask a Local | Korea By Local"
        description="Your question has been sent to a local. We'll get back to you soon."
        path="/ask-a-local/success"
        noindex
      />
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green/10">
          <CheckCircle className="h-8 w-8 text-green" />
        </div>
        <h1 className="font-display text-[clamp(28px,4vw,40px)] font-extrabold tracking-[-0.02em] text-ink">
          Thank you!{" "}
          <span className="font-serif-accent font-medium italic text-accent">A local’s on it.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-[46ch] text-[16px] text-muted">
          Your payment went through and your question is with a verified Korean host. Expect a reply by
          email — usually within a few hours.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center justify-center rounded-[12px] bg-accent px-7 py-3.5 text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(255,107,53,0.35)] transition-transform hover:scale-[1.03]"
        >
          Back to home
        </Link>
      </div>
    </>
  );
}
