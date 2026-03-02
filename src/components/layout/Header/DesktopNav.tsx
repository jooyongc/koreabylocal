import { Link } from "react-router-dom";
import NavDropdown from "./NavDropdown";
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

export default function DesktopNav() {
  return (
    <nav className="hidden lg:flex items-center gap-6">
      {NAV_ITEMS.map((item) =>
        item.dropdown ? (
          <NavDropdown
            key={item.href}
            label={item.label}
            href={item.href}
            items={item.dropdown}
          />
        ) : (
          <Link
            key={item.href}
            to={item.href}
            className="text-sm font-medium tracking-wide text-primary hover:text-primary-light transition-colors"
          >
            {item.label}
          </Link>
        ),
      )}
    </nav>
  );
}
