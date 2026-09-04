import { useEffect, useState } from "react";
import { X, Loader2, BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { hasSubscribed, markSubscribed } from "@/lib/subscription";

const SESSION_KEY = "kbl_exit_popup_shown";
const SCROLL_THRESHOLD = 0.7;

function alreadyShownThisSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function markShown() {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // sessionStorage unavailable — the popup may show again, which is an acceptable fallback.
  }
}

/** Free e-book sample capture, triggered by exit intent (desktop) or scroll depth (mobile). Shows at most once per session. */
export default function ExitIntentPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

  useEffect(() => {
    if (hasSubscribed() || alreadyShownThisSession()) return;

    const trigger = () => {
      if (alreadyShownThisSession()) return;
      markShown();
      setVisible(true);
    };

    // Desktop: cursor exits through the top of the viewport toward the browser chrome.
    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0 && !e.relatedTarget) trigger();
    };

    // Mobile/touch has no mouse-leave signal, so use scroll depth instead.
    const onScroll = () => {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (total > 0 && scrolled / total >= SCROLL_THRESHOLD) trigger();
    };

    document.addEventListener("mouseout", onMouseOut);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const close = () => setVisible(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || status === "submitting") return;
    setStatus("submitting");
    const { error } = await supabase.from("subscribers").insert({
      email: trimmedEmail,
      source: "popup",
      lead_magnet: "ebook_sample",
    });
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      setStatus("idle");
      return;
    }
    supabase.functions
      .invoke("send-welcome-email", { body: { email: trimmedEmail, lead_magnet: "ebook_sample" } })
      .catch(() => {
        // Email failure should not block the subscribe confirmation.
      });
    markSubscribed();
    setStatus("success");
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4" onClick={close}>
      <div
        className="relative w-full max-w-[420px] rounded-[20px] bg-white p-[clamp(24px,4vw,32px)] shadow-[0_30px_70px_rgba(26,26,26,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          aria-label="Close"
          className="absolute right-4 top-4 text-muted-2 transition-colors hover:text-ink"
        >
          <X className="h-5 w-5" />
        </button>

        {status === "success" ? (
          <div className="py-4 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-accent" />
            <h3 className="mt-3 font-display text-[19px] font-extrabold text-ink">Check your inbox!</h3>
            <p className="mt-1.5 text-[14px] text-muted">Your free sample is on its way.</p>
          </div>
        ) : (
          <>
            <BookOpen className="h-8 w-8 text-accent" />
            <h3 className="mt-3 font-display text-[20px] font-extrabold leading-tight text-ink">
              Wait — before you go!
            </h3>
            <p className="mt-2 text-[14px] text-muted">
              Get 2 free chapters of our Korea e-book — real tips from real locals, straight to your inbox.
            </p>
            <form onSubmit={submit} className="mt-5 flex flex-col gap-2.5">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="rounded-[13px] border border-ink/12 px-[16px] py-[12px] text-[15px] text-ink outline-none placeholder:text-muted-3"
              />
              <button
                type="submit"
                disabled={status === "submitting"}
                className="flex items-center justify-center gap-2 rounded-[13px] bg-accent py-[12px] text-[15px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {status === "submitting" && <Loader2 className="h-4 w-4 animate-spin" />}
                Send me the free sample
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
