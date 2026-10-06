import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, MailX } from "lucide-react";
import PageSEO from "@/components/common/PageSEO";
import { supabase } from "@/lib/supabase";

type State = "idle" | "working" | "done" | "error";

/**
 * Where a newsletter's "Unsubscribe" link lands. It asks before acting: mail
 * scanners open links on their own, and a bare visit must not unsubscribe anyone.
 * (Gmail's own one-click button posts to the edge function directly.)
 */
export default function UnsubscribePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, setState] = useState<State>("idle");

  const confirm = async () => {
    setState("working");
    const { error } = await supabase.functions.invoke("newsletter-unsubscribe", { body: { token } });
    setState(error ? "error" : "done");
  };

  return (
    <>
      <PageSEO title="Unsubscribe | Korea By Local" description="Stop receiving the Korea by Local newsletter." path="/unsubscribe" noindex />

      <div className="mx-auto max-w-[520px] px-4 py-[clamp(48px,8vw,96px)] text-center sm:px-6">
        {state === "done" ? (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green/10">
              <CheckCircle2 className="h-8 w-8 text-green" />
            </div>
            <h1 className="font-display text-[clamp(26px,4vw,36px)] font-extrabold tracking-[-0.02em] text-ink">
              You're unsubscribed
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              You won't get any more newsletters from us. Changed your mind? Sign up again any time at the bottom of any page.
            </p>
            <Link to="/" className="mt-7 inline-block font-semibold text-accent">← Back to Korea by Local</Link>
          </>
        ) : !token ? (
          <>
            <h1 className="font-display text-2xl font-bold text-ink">This link is incomplete</h1>
            <p className="mt-2 text-muted">
              Use the "Unsubscribe" link at the bottom of one of our newsletters, or reply to it and we'll take you off the list.
            </p>
            <Link to="/" className="mt-6 inline-block font-semibold text-accent">← Back to Korea by Local</Link>
          </>
        ) : (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
              <MailX className="h-8 w-8 text-accent" />
            </div>
            <h1 className="font-display text-[clamp(26px,4vw,36px)] font-extrabold tracking-[-0.02em] text-ink">
              Unsubscribe from our newsletter?
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              You'll stop getting local tips and guides by email. Anything you've already downloaded stays yours.
            </p>
            <button
              onClick={confirm}
              disabled={state === "working"}
              className="mt-7 inline-flex items-center gap-2 rounded-[13px] bg-ink px-7 py-3.5 text-[14.5px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {state === "working" && <Loader2 className="h-4 w-4 animate-spin" />}
              Unsubscribe
            </button>
            {state === "error" && (
              <p className="mt-4 text-[14px] text-red-600">
                That didn't work — the link may have expired. Reply to the newsletter and we'll remove you by hand.
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}
