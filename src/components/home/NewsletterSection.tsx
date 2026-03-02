import { useState } from "react";
import type { FormEvent } from "react";
import { Send } from "lucide-react";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // TODO: integrate with newsletter service
    setSubmitted(true);
  };

  return (
    <section className="bg-primary py-16">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <h2 className="text-2xl font-bold text-white md:text-3xl">
          Get Local Travel Tips &amp; Deals
        </h2>
        <p className="mt-2 text-sm text-white/60 md:text-base">
          Subscribe to our newsletter for exclusive Korean travel insights from locals.
        </p>

        {submitted ? (
          <div className="mt-8 rounded-xl bg-white/10 p-6 backdrop-blur-sm">
            <p className="text-lg font-medium text-white">Thank you for subscribing!</p>
            <p className="mt-1 text-sm text-white/60">
              We'll send you the best local tips and deals.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 rounded-full bg-white/10 px-5 py-3 text-sm text-white placeholder-white/40 outline-none ring-1 ring-white/20 backdrop-blur-sm transition-all focus:bg-white/15 focus:ring-white/40"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary transition-all hover:bg-white/90 active:scale-[0.98]"
            >
              Subscribe
              <Send className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
