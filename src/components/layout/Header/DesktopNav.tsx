import { NavLink, useLocation } from "react-router-dom";
import NavDropdown from "./NavDropdown";

// v3 IA: Explore (home spot gallery) · Guidebook (guides/getting there/ask a local) · About.
const GUIDEBOOK_ITEMS = [
  { label: "📖 Guides", href: "/guidebook" },
  { label: "🚂 Getting There", href: "/transfers" },
  { label: "❓ Ask a Local", href: "/ask-a-local" },
];

export default function DesktopNav() {
  const location = useLocation();

  // On the homepage, "Explore" scrolls to the spot gallery instead of reloading the route.
  const handleExploreClick = (e: React.MouseEvent) => {
    if (location.pathname === "/") {
      const gallery = document.getElementById("spot-gallery");
      if (gallery) {
        e.preventDefault();
        gallery.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-[14.5px] font-semibold tracking-[-0.01em] transition-colors ${
      isActive ? "text-accent" : "text-ink hover:text-accent"
    }`;

  return (
    <nav className="hidden items-center gap-[clamp(14px,1.8vw,26px)] lg:flex">
      <NavLink to="/" onClick={handleExploreClick} className={linkClass}>
        Explore
      </NavLink>

      <NavDropdown label="Guidebook" href="/guidebook" items={GUIDEBOOK_ITEMS} />

      <NavLink to="/about" className={linkClass}>
        About
      </NavLink>
    </nav>
  );
}
