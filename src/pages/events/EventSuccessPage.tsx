import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import PageSEO from "@/components/common/PageSEO";
import { supabase } from "@/lib/supabase";

type State = { kind: "capturing" } | { kind: "done"; code: string | null } | { kind: "failed" };

/**
 * PayPal returns the buyer here with ?token=<order id>. The money is not taken
 * until capture-event-payment runs, so this page has to call it — and it is
 * safe to call twice, because that function is idempotent.
 */
export default function EventSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("token");

  const [state, setState] = useState<State>(orderId ? { kind: "capturing" } : { kind: "failed" });
  const started = useRef(false);

  useEffect(() => {
    if (!orderId || started.current) return;
    started.current = true;

    (async () => {
      const { data, error } = await supabase.functions.invoke("capture-event-payment", {
        body: { orderId },
      });
      setState(!error && data?.success ? { kind: "done", code: data.confirmation_code ?? null } : { kind: "failed" });
    })();
  }, [orderId]);

  if (!orderId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">Nothing to show here</h1>
        <p className="mt-2 text-muted">This page is only reachable after a checkout.</p>
        <Link to="/events" className="mt-6 inline-block font-semibold text-accent">← Back to events</Link>
      </div>
    );
  }

  return (
    <>
      <PageSEO title="Thank you! | Korea By Local" description="Your ticket is confirmed." path="/events/success" noindex />

      <div className="mx-auto max-w-[560px] px-4 py-[clamp(48px,8vw,96px)] text-center sm:px-6">
        {state.kind === "capturing" && (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent" />
            <h1 className="mt-5 font-display text-[22px] font-extrabold text-ink">Confirming your payment…</h1>
            <p className="mt-2 text-[14px] text-muted">One moment — please don't close this page.</p>
          </>
        )}

        {state.kind === "done" && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green/10">
              <CheckCircle2 className="h-8 w-8 text-green" />
            </div>
            <h1 className="font-display text-[clamp(28px,4vw,40px)] font-extrabold tracking-[-0.02em] text-ink">
              You're in!
            </h1>
            <p className="mt-3 text-[15px] text-muted">We've also emailed this confirmation code to your PayPal email address.</p>

            {state.code && (
              <div className="mt-8 inline-block rounded-2xl bg-gray-50 px-8 py-5">
                <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-2">Confirmation code</div>
                <div className="mt-1.5 font-display text-[28px] font-extrabold tracking-[0.06em] text-ink">{state.code}</div>
              </div>
            )}
            <p className="mt-4 text-[13px] text-muted-2">Show this code (or the confirmation email) at check-in.</p>

            <div className="mt-6">
              <Link to="/" className="text-[14.5px] font-semibold text-accent hover:underline">
                Explore more →
              </Link>
            </div>
          </>
        )}

        {state.kind === "failed" && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
            <h1 className="font-display text-[clamp(24px,3vw,32px)] font-extrabold text-ink">
              We couldn't confirm that payment
            </h1>
            <p className="mx-auto mt-4 max-w-[48ch] text-[15px] text-muted">
              If PayPal has charged you, nothing is lost — email us at{" "}
              <a className="font-semibold text-accent" href="mailto:koreabylocal@gmail.com">
                koreabylocal@gmail.com
              </a>{" "}
              with this reference and we'll confirm your spot.
            </p>
            <p className="mt-3 font-mono text-[13px] text-muted">{orderId}</p>
            <Link to="/events" className="mt-8 inline-block font-semibold text-accent">
              ← Back to events
            </Link>
          </>
        )}
      </div>
    </>
  );
}
