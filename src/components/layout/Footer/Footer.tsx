import { useState } from "react";
import { Link } from "react-router-dom";
import { Instagram, Youtube, Facebook, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { markSubscribed } from "@/lib/subscription";
import { useRegions } from "@/hooks/useConcepts";
import Logo from "@/components/layout/Header/Logo";

const RESOURCE_LINKS = [
  { label: "Guidebook", href: "/guidebook" },
  { label: "Getting There", href: "/getting-there" },
  { label: "Ask a Local", href: "/ask-a-local" },
  { label: "E-book", href: "/ebook" },
  { label: "About", href: "/about" },
];

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com/koreabylocal.travel", icon: Instagram },
  { label: "YouTube", href: "https://youtube.com", icon: Youtube },
  { label: "Facebook", href: "https://facebook.com", icon: Facebook },
];

function FooterNewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || status === "submitting") return;
    setStatus("submitting");
    const { error } = await supabase.from("subscribers").insert({
      email: trimmedEmail,
      source: "footer",
    });
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      setStatus("idle");
      return;
    }
    supabase.functions.invoke("send-welcome-email", { body: { email: trimmedEmail } }).catch(() => {
      // Email failure should not block the subscribe confirmation.
    });
    markSubscribed();
    setStatus("success");
    setEmail("");
  };

  if (status === "success") {
    return <p className="text-[13.5px] font-semibold text-white">Check your inbox! ✓</p>;
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        className="min-w-0 flex-1 rounded-full bg-white/10 px-3.5 py-2 text-[13px] text-white outline-none placeholder:text-white/50"
      />
      <button
        type="submit"
        disabled={status === "submitting"}
        aria-label="Subscribe"
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {status === "submitting" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <>
            <span className="hidden sm:inline">Subscribe</span>
            <ArrowRight className="h-3.5 w-3.5 sm:hidden" />
          </>
        )}
      </button>
    </form>
  );
}

export default function Footer() {
  const { data: regions } = useRegions();
  const destinationLinks = (regions ?? []).slice(0, 4);

  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-[1180px] px-4 pb-7 pt-[clamp(40px,5vw,64px)] sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Col 1 — Brand */}
          <div className="col-span-2 min-w-[200px] md:col-span-1">
            <Logo inverted />
            <p className="mt-3.5 max-w-[34ch] text-[13.5px] leading-relaxed text-white/60">
              Korea's local travel guide since 2019.
            </p>
            <div className="mt-4 flex gap-2.5">
              {SOCIALS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white/8 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Col 2 — Explore / Destinations */}
          <div>
            <div className="mb-3.5 text-xs font-bold uppercase tracking-[0.1em] text-white/45">Explore</div>
            <div className="flex flex-col gap-2.5">
              <Link to="/" className="text-sm text-white/70 transition-colors hover:text-white">
                Home
              </Link>
            </div>

            <div className="mb-3.5 mt-6 text-xs font-bold uppercase tracking-[0.1em] text-white/45">
              Destinations
            </div>
            <div className="flex flex-col gap-2.5">
              {destinationLinks.map((region) => (
                <Link
                  key={region.key}
                  to={`/destinations/${region.key}`}
                  className="text-sm text-white/70 transition-colors hover:text-white"
                >
                  {region.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Col 3 — Resources */}
          <div>
            <div className="mb-3.5 text-xs font-bold uppercase tracking-[0.1em] text-white/45">Resources</div>
            <div className="flex flex-col gap-2.5">
              {RESOURCE_LINKS.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-sm text-white/70 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Col 4 — Newsletter */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-3.5 text-xs font-bold uppercase tracking-[0.1em] text-white/45">Newsletter</div>
            <p className="mb-3.5 text-sm text-white/70">Korea travel tips from locals, in your inbox.</p>
            <FooterNewsletterForm />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-9 flex flex-col gap-2 border-t border-white/10 pt-5 text-[12.5px] text-white/45">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <span>&copy; 2019-{new Date().getFullYear()} Korea by Local. All rights reserved.</span>
            <div className="flex gap-4">
              <Link to="/privacy" className="transition-colors hover:text-white/80">
                Privacy
              </Link>
              <Link to="/terms" className="transition-colors hover:text-white/80">
                Terms
              </Link>
            </div>
          </div>
          <span>관광사업자등록번호(종합여행업) 제26004-2024-000013호</span>
        </div>
      </div>
    </footer>
  );
}
