import { NavLink } from "react-router-dom";

// IA: Travel Blog (articles), Things to Do (local spots), Getting There
// (transport — its own menu, headed for partner bookings), Ask a Local (paid
// concierge Q&A) — kept separate from E-book so the two products are never confused.

export default function DesktopNav() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-[14.5px] font-semibold tracking-[-0.01em] transition-colors ${
      isActive ? "text-accent" : "text-ink hover:text-accent"
    }`;

  return (
    <nav className="hidden items-center gap-[clamp(14px,1.8vw,26px)] lg:flex">
      <NavLink to="/guidebook" className={linkClass}>
        Travel Blog
      </NavLink>

      <NavLink to="/things-to-do" className={linkClass}>
        Things to Do
      </NavLink>

      <NavLink to="/getting-there" className={linkClass}>
        Getting There
      </NavLink>

      <NavLink to="/ask-a-local" className={linkClass}>
        Ask a Local
      </NavLink>

      <NavLink to="/ebook" className={linkClass}>
        E-book
      </NavLink>

      <NavLink to="/about" className={linkClass}>
        About
      </NavLink>
    </nav>
  );
}
