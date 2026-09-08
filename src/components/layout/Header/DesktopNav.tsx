import { NavLink } from "react-router-dom";
import NavDropdown from "./NavDropdown";

// v3 IA: Travel Tips (guidebook articles) Guidebook (getting there/ask a local) About.
const GUIDEBOOK_ITEMS = [
  { label: "Getting There", href: "/getting-there" },
  { label: "Ask a Local", href: "/ask-a-local" },
];

export default function DesktopNav() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-[14.5px] font-semibold tracking-[-0.01em] transition-colors ${
      isActive ? "text-accent" : "text-ink hover:text-accent"
    }`;

  return (
    <nav className="hidden items-center gap-[clamp(14px,1.8vw,26px)] lg:flex">
      <NavLink to="/guidebook" className={linkClass}>
        Travel Tips
      </NavLink>

      <NavDropdown label="Guidebook" href="/guidebook" items={GUIDEBOOK_ITEMS} />

      <NavLink to="/about" className={linkClass}>
        About
      </NavLink>
    </nav>
  );
}
