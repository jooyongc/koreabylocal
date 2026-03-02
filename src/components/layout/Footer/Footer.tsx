import { Link } from "react-router-dom";
import { Instagram, Youtube, Facebook, Twitter } from "lucide-react";
import FooterColumn from "./FooterColumn";

const QUICK_LINKS = [
  { label: "Curated Tours", href: "/tours" },
  { label: "Transfers", href: "/transfers" },
  { label: "Blog", href: "/blog" },
  { label: "Shop", href: "/shop" },
  { label: "Ask a Local", href: "/ask-a-local" },
];

const SUPPORT_LINKS = [
  { label: "FAQ", href: "/faq" },
  { label: "Contact Us", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://instagram.com", icon: Instagram },
  { label: "YouTube", href: "https://youtube.com", icon: Youtube },
  { label: "Facebook", href: "https://facebook.com", icon: Facebook },
  { label: "Twitter", href: "https://twitter.com", icon: Twitter },
];

function FooterLink({ href, label }: { href: string; label: string }) {
  const isExternal = href.startsWith("http");
  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block py-1 text-sm text-white/60 hover:text-white transition-colors"
      >
        {label}
      </a>
    );
  }
  return (
    <Link
      to={href}
      className="block py-1 text-sm text-white/60 hover:text-white transition-colors"
    >
      {label}
    </Link>
  );
}

export default function Footer() {
  return (
    <footer className="bg-primary text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* About */}
          <FooterColumn title="About">
            <img src="/logo-white.svg" alt="Korea by Local" className="h-10 mb-3" />
            <p className="text-sm leading-relaxed text-white/60">
              Korea by Local connects travellers with authentic Korean
              experiences curated by locals who know and love their cities.
            </p>
          </FooterColumn>

          {/* Quick Links */}
          <FooterColumn title="Quick Links">
            {QUICK_LINKS.map((link) => (
              <FooterLink key={link.href} {...link} />
            ))}
          </FooterColumn>

          {/* Support */}
          <FooterColumn title="Support">
            {SUPPORT_LINKS.map((link) => (
              <FooterLink key={link.href} {...link} />
            ))}
          </FooterColumn>

          {/* Follow Us */}
          <FooterColumn title="Follow Us">
            <div className="flex gap-3">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </FooterColumn>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-white/40">
          &copy; {new Date().getFullYear()} Korea by Local. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
