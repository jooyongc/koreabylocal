import { useState } from "react";
import toast from "react-hot-toast";
import { useReveal } from "@/hooks/useReveal";

export default function NewsletterCta() {
  const ref = useReveal<HTMLElement>();
  const [email, setEmail] = useState("");

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // TODO(db): persist subscriber + trigger welcome email.
    toast.success("You’re on the list — see you in your inbox.");
    setEmail("");
  };

  return (
    <section
      ref={ref}
      className="reveal mx-auto mt-[clamp(48px,7vw,90px)] max-w-[1180px] px-4 pb-[clamp(48px,7vw,90px)] sm:px-6 lg:px-8"
    >
      <div
        className="relative overflow-hidden rounded-[28px] p-[clamp(32px,5vw,60px)] text-center text-white"
        style={{ background: "linear-gradient(120deg,#5b2bff,#ff2d78)" }}
      >
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
              className="rounded-[13px] bg-ink px-7 py-[15px] text-[15px] font-bold text-white transition-transform hover:scale-[1.03]"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
