import { useState } from "react";
import { X, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { markSubscribed } from "@/lib/subscription";

const STORAGE_KEY = "kbl_newsletter_banner_dismissed_until";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function remember() {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now() + SEVEN_DAYS_MS));
  } catch {
    // localStorage unavailable — banner just won't persist dismissal, which is fine.
  }
}

function isInitiallyVisible() {
  try {
    const until = localStorage.getItem(STORAGE_KEY);
    return !until || Date.now() > Number(until);
  } catch {
    return true;
  }
}

export default function NewsletterBanner() {
  const [visible, setVisible] = useState(isInitiallyVisible);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

  const dismiss = () => {
    remember();
    setVisible(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === "submitting") return;
    setStatus("submitting");
    const trimmedEmail = email.trim();
    const { error } = await supabase.from("subscribers").insert({
      email: trimmedEmail,
      source: "homepage_banner",
      lead_magnet: "checklist",
    });
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      setStatus("idle");
      return;
    }
    supabase.functions
      .invoke("send-welcome-email", { body: { email: trimmedEmail, lead_magnet: "checklist" } })
      .catch(() => {
        // Email failure should not block the subscribe confirmation.
      });
    markSubscribed();
    remember();
    setStatus("success");
    setEmail("");
  };

  if (!visible) return null;

  return (
    <div className="relative z-40 bg-ink px-4 py-2.5 text-white">
      <div className="relative mx-auto flex max-w-[1180px] items-center justify-center gap-3 px-8 text-center">
        {status === "success" ? (
          <p className="text-[13.5px] font-semibold">Check your inbox!</p>
        ) : (
          <form onSubmit={submit} className="flex flex-wrap items-center justify-center gap-2.5 text-center">
            <span className="hidden text-[13.5px] font-medium text-white/90 sm:inline">
              First time in Korea? Get our free travel checklist by email.
            </span>
            <span className="text-[13.5px] font-medium text-white/90 sm:hidden">
              Free Korea checklist →
            </span>
            <div className="flex items-center justify-center gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="min-w-0 rounded-full bg-white/10 px-3.5 py-1.5 text-[13px] text-white outline-none placeholder:text-white/50 sm:w-[200px]"
              />
              <button
                type="submit"
                disabled={status === "submitting"}
                className="hidden shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:flex"
              >
                {status === "submitting" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Get it free
              </button>
              <button
                type="submit"
                disabled={status === "submitting"}
                aria-label="Get it free"
                className="flex shrink-0 items-center justify-center rounded-full bg-accent p-1.5 text-white disabled:opacity-50 sm:hidden"
              >
                {status === "submitting" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </form>
        )}
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-4 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
