import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, BookOpen } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  badge?: string;
  children?: { label: string; href: string }[];
}

// v3 IA: Explore (home spot gallery) · Guidebook (guides/getting there/ask a local) · About · E-book.
const NAV_ITEMS: NavItem[] = [
  { label: "Explore", href: "/" },
  {
    label: "Guidebook",
    href: "/guidebook",
    children: [
      { label: "Guides", href: "/guidebook" },
      { label: "Getting There", href: "/getting-there" },
      { label: "Ask a Local", href: "/ask-a-local" },
    ],
  },
  { label: "About", href: "/about" },
  { label: "E-book", href: "/ebook", badge: "NEW" },
];

export default function MobileNav() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const close = () => {
    setIsOpen(false);
    setExpanded(null);
  };

  // On the homepage, "Explore" scrolls to the spot gallery instead of reloading the route.
  const handleItemClick = (href: string) => {
    close();
    if (href === "/" && location.pathname === "/") {
      setTimeout(() => {
        document.getElementById("spot-gallery")?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  };

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setIsOpen(true)}
        className="-ml-1 flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm" onClick={close} aria-hidden />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-[82%] max-w-xs bg-paper shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <span className="font-display text-lg font-extrabold text-ink">Menu</span>
          <button
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="overflow-y-auto px-3 py-3" style={{ maxHeight: "calc(100vh - 65px)" }}>
          {NAV_ITEMS.map((item) => (
            <div key={item.label}>
              {item.children ? (
                <>
                  <button
                    onClick={() => setExpanded((p) => (p === item.label ? null : item.label))}
                    className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-[15px] font-semibold text-ink transition-colors hover:bg-ink/5"
                  >
                    {item.label}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${expanded === item.label ? "rotate-180" : ""}`}
                    />
                  </button>
                  {expanded === item.label && (
                    <div className="ml-3 border-l-2 border-ink/10 pl-3 pb-1">
                      {item.children.map((sub) => (
                        <Link
                          key={sub.href}
                          to={sub.href}
                          onClick={close}
                          className="block rounded-lg px-4 py-2.5 text-sm text-muted transition-colors hover:bg-ink/5 hover:text-ink"
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to={item.href}
                  onClick={() => handleItemClick(item.href)}
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-[15px] font-semibold text-ink transition-colors hover:bg-ink/5"
                >
                  {item.label === "E-book" && <BookOpen className="h-4 w-4" />}
                  {item.label}
                  {item.badge && (
                    <span className="rounded-full bg-accent px-1.5 py-[1px] text-[9px] font-extrabold uppercase tracking-wide text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
