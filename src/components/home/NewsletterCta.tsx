import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useReveal } from "@/hooks/useReveal";
import { supabase } from "@/lib/supabase";
import { markSubscribed } from "@/lib/subscription";

export default function NewsletterCta() {
  const ref = useReveal<HTMLElement>();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || submitting) return;
    setSubmitting(true);
    const { error } = await supabase.from("subscribers").insert({
      email: trimmedEmail,
      source: "guidebook_cta",
    });
    setSubmitting(false);
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      toast.error("Something went wrong — please try again.");
      return;
    }
    supabase.functions.invoke("send-welcome-email", { body: { email: trimmedEmail } }).catch(() => {
      // Email failure should not block the subscribe confirmation.
    });
    markSubscribed();
    toast.success("You’re on the list — see you in your inbox.");
    setEmail("");
  };

  return (
    <section
      ref={ref}
      className="reveal mx-auto mt-[clamp(48px,7vw,90px)] max-w-[1180px] px-4 pb-[clamp(48px,7vw,90px)] sm:px-6 lg:px-8"
    >
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-ink to-coral p-[clamp(32px,5vw,60px)] text-center text-white">
        <div className="absolute -right-[30px] -top-[40px] h-[200px] w-[200px] rounded-full bg-white/10" />
        <div className="relative">
          <h2 className="font-display text-[clamp(26px,3.6vw,42px)] font-extrabold tracking-[-0.02em]">
            The local edit, in your inbox
          </h2>
          <p className="mx-auto my-3 mb-6 max-w-[48ch] text-[15px] text-white/90">
            One thoughtful email a month — new experiences, seasonal routes and
            stories from our hosts.
          </p>
          <form onSubmit={subscribe} className="mx-auto flex max-w-[480px] flex-wrap justify-center gap-2.5">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="min-w-0 flex-1 rounded-[13px] bg-white/95 px-[18px] py-[15px] text-[15px] text-ink outline-none"
            />
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-[13px] bg-accent px-7 py-[15px] text-[15px] font-bold text-white transition-colors hover:bg-accent-dark disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
