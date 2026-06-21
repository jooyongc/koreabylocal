import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Magazine", href: "/blog" },
  { label: "Ask a Local", href: "/ask-a-local" },
  { label: "Experiences", href: "/tours" },
  {
    label: "Transfers",
    href: "/transfers",
    children: [
      { label: "All transfers", href: "/transfers" },
      { label: "Transportation", href: "/transfers/transportation" },
      { label: "Tour Planning", href: "/transfers/tour-planning" },
    ],
  },
  {
    label: "Shop",
    href: "/shop",
    children: [
      { label: "All", href: "/shop" },
      { label: "Magazine", href: "/shop/magazine" },
      { label: "K-Goods", href: "/shop/k-goods" },
      { label: "Print", href: "/shop/print" },
    ],
  },
];

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const close = () => {
    setIsOpen(false);
    setExpanded(null);
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
                  onClick={close}
                  className="block rounded-xl px-4 py-3 text-[15px] font-semibold text-ink transition-colors hover:bg-ink/5"
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
