import { NavLink } from "react-router-dom";

// Magazine-led IA (matches the 2026 renewal design).
export const NAV_ITEMS = [
  { label: "Magazine", to: "/blog" },
  { label: "Ask a Local", to: "/ask-a-local" },
  { label: "Experiences", to: "/tours" },
  { label: "Transfers", to: "/transfers" },
  { label: "Shop", to: "/shop" },
];

export default function DesktopNav() {
  return (
    <nav className="hidden items-center gap-[clamp(14px,1.8vw,26px)] lg:flex">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `text-[14.5px] font-semibold tracking-[-0.01em] transition-colors ${
              isActive ? "text-accent" : "text-ink hover:text-accent"
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
