import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import type { DropdownItem } from "./NavDropdown";

interface NavItem {
  label: string;
  href: string;
  dropdown?: DropdownItem[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "CURATED TOURS", href: "/tours" },
  {
    label: "TRANSFERS",
    href: "/transfers",
    dropdown: [
      { label: "All", href: "/transfers" },
      { label: "Transportation", href: "/transfers/transportation" },
      { label: "Tour Planning", href: "/transfers/tour-planning" },
    ],
  },
  { label: "BLOG", href: "/blog" },
  { label: "ASK A LOCAL", href: "/ask-a-local" },
  {
    label: "SHOP",
    href: "/shop",
    dropdown: [
      { label: "All", href: "/shop" },
      { label: "Magazine", href: "/shop/magazine" },
      { label: "K-Goods", href: "/shop/k-goods" },
      { label: "Print", href: "/shop/print" },
    ],
  },
  { label: "ABOUT US", href: "/about" },
];

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const close = () => {
    setIsOpen(false);
    setExpandedItem(null);
  };

  const toggleAccordion = (label: string) => {
    setExpandedItem((prev) => (prev === label ? null : label));
  };

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-primary hover:text-primary-light transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={close}
          aria-hidden
        />
      )}

      {/* Slide-out panel */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <span className="text-lg font-bold text-primary">Menu</span>
          <button
            onClick={close}
            className="p-2 text-primary hover:text-primary-light transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="overflow-y-auto px-2 py-2" style={{ maxHeight: "calc(100vh - 57px)" }}>
          {NAV_ITEMS.map((item) => (
            <div key={item.label}>
              {item.dropdown ? (
                <>
                  <button
                    onClick={() => toggleAccordion(item.label)}
                    className="flex w-full items-center justify-between px-3 py-3 text-sm font-medium tracking-wide text-primary hover:bg-background-gray rounded-md transition-colors"
                  >
                    {item.label}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        expandedItem === item.label ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {expandedItem === item.label && (
                    <div className="ml-3 border-l-2 border-gray-100 pl-3 pb-1">
                      {item.dropdown.map((sub) => (
                        <Link
                          key={sub.href}
                          to={sub.href}
                          className="block rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-background-gray hover:text-primary transition-colors"
                          onClick={close}
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
                  className="block px-3 py-3 text-sm font-medium tracking-wide text-primary hover:bg-background-gray rounded-md transition-colors"
                  onClick={close}
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
