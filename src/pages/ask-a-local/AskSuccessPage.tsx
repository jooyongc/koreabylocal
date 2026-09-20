import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import PageSEO from "@/components/common/PageSEO";
import { supabase } from "@/lib/supabase";

type State = "capturing" | "done" | "failed";

/**
 * PayPal returns the buyer here with ?token=<order id>. The money is not taken
 * until capture-inquiry-payment runs, so this page has to call it — and it is
 * safe to call twice, because that function is idempotent.
 */
export default function AskSuccessPage() {
  const [searchParams] = useSearchParams();
  // Polar used checkout_id; kept so a link from an older checkout still lands
  // somewhere sensible rather than on "nothing to show here".
  const orderId = searchParams.get("token") ?? searchParams.get("checkout_id");

  const [state, setState] = useState<State>(orderId ? "capturing" : "failed");
  // React runs effects twice in StrictMode; one payment should mean one call.
  const started = useRef(false);

  useEffect(() => {
    if (!orderId || started.current) return;
    started.current = true;

    (async () => {
      const { data, error } = await supabase.functions.invoke("capture-inquiry-payment", {
        body: { orderId },
      });
      setState(!error && data?.success ? "done" : "failed");
    })();
  }, [orderId]);

  if (!orderId) {
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
        {state === "capturing" && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
            <h1 className="font-display text-[clamp(24px,3vw,32px)] font-extrabold text-ink">
              Confirming your payment…
            </h1>
            <p className="mx-auto mt-3 max-w-[46ch] text-[15px] text-muted">
              One moment — please don’t close this page.
            </p>
          </>
        )}

        {state === "done" && (
          <>
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
              className="mt-8 inline-flex items-center justify-center rounded-[12px] bg-accent px-7 py-3.5 text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(255,46,151,0.35)] transition-transform hover:scale-[1.03]"
            >
              Back to home
            </Link>
          </>
        )}

        {state === "failed" && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
            <h1 className="font-display text-[clamp(24px,3vw,32px)] font-extrabold text-ink">
              We couldn’t confirm that payment
            </h1>
            {/* Deliberately not "your payment failed" — we do not know that. */}
            <p className="mx-auto mt-4 max-w-[48ch] text-[15px] text-muted">
              Your question is saved. If PayPal has charged you, nothing is lost — email us at{" "}
              <a className="font-semibold text-accent" href="mailto:koreabylocal@gmail.com">
                koreabylocal@gmail.com
              </a>{" "}
              with this reference and we’ll sort it out.
            </p>
            <p className="mt-3 font-mono text-[13px] text-muted">{orderId}</p>
            <Link to="/ask-a-local" className="mt-8 inline-block font-semibold text-accent">
              ← Back to Ask a local
            </Link>
          </>
        )}
      </div>
    </>
  );
}
