import { Link } from "react-router-dom";
import { Instagram, Youtube, Facebook } from "lucide-react";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Explore",
    links: [
      { label: "Experiences", href: "/tours" },
      { label: "Private transfers", href: "/transfers" },
      { label: "The Magazine", href: "/blog" },
      { label: "K-Goods shop", href: "/shop" },
      { label: "Ask a Local", href: "/ask-a-local" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", href: "/about" },
      { label: "The Magazine", href: "/blog" },
      { label: "Become a host", href: "/ask-a-local" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Ask a Local", href: "/ask-a-local" },
    ],
  },
];

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com/koreabylocal.travel", icon: Instagram },
  { label: "YouTube", href: "https://youtube.com", icon: Youtube },
  { label: "Facebook", href: "https://facebook.com", icon: Facebook },
];

export default function Footer() {
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-[1180px] px-4 pb-7 pt-[clamp(40px,5vw,64px)] sm:px-6 lg:px-8">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-8">
          {/* Brand */}
          <div className="min-w-[200px]">
            <Link to="/" className="inline-flex" aria-label="Korea by Local — home">
              <img src="/logo-white.png" alt="Korea by Local" className="h-7 w-auto" width={177} height={15} />
            </Link>
            <p className="mt-3.5 max-w-[34ch] text-[13.5px] leading-relaxed text-white/60">
              Authentic Korean experiences, designed and hosted by verified locals
              who know and love their cities.
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

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="mb-3.5 text-xs font-bold uppercase tracking-[0.1em] text-white/45">
                {col.title}
              </div>
              <div className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <Link
                    key={link.label + link.href}
                    to={link.href}
                    className="text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-9 flex flex-wrap justify-between gap-2.5 border-t border-white/10 pt-5 text-[12.5px] text-white/45">
          <span>&copy; {new Date().getFullYear()} Korea by Local. All rights reserved.</span>
          <span>Made in Seoul · 서울에서 만듦</span>
        </div>
      </div>
    </footer>
  );
}
