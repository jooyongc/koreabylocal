import { NavLink } from "react-router-dom";
import NavDropdown from "./NavDropdown";

// IA: three clear pillars — Travel Blog (articles), Experiences (curated
// tours, plus logistics under "Getting There"), Ask a Local (paid concierge
// Q&A) — kept separate from E-book so the two products are never confused.
const EXPERIENCES_ITEMS = [{ label: "Getting There", href: "/getting-there" }];

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

      <NavDropdown label="Experiences" href="/experiences" items={EXPERIENCES_ITEMS} />

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
