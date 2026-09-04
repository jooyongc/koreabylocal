import { useState, useRef, useCallback } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";

// v3 IA: Explore (home spot gallery) · Guidebook (guides/getting there/ask a local) · About.
export const NAV_ITEMS = [
  { label: "Explore", to: "/" },
  {
    label: "Guidebook",
    to: "/guidebook",
    children: [
      { label: "Guides", to: "/guidebook" },
      { label: "Getting There", to: "/getting-there" },
      { label: "Ask a Local", to: "/ask-a-local" },
    ],
  },
  { label: "About", to: "/about" },
];

export default function DesktopNav() {
  const location = useLocation();
  const [openLabel, setOpenLabel] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpenLabel(null), 150);
  }, []);

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
      {NAV_ITEMS.map((item) =>
        item.children ? (
          <div
            key={item.label}
            className="relative"
            onMouseEnter={() => {
              cancelClose();
              setOpenLabel(item.label);
            }}
            onMouseLeave={scheduleClose}
          >
            <NavLink to={item.to} className={({ isActive }) => `flex items-center gap-1 ${linkClass({ isActive })}`}>
              {item.label}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${openLabel === item.label ? "rotate-180" : ""}`}
              />
            </NavLink>
            {openLabel === item.label && (
              <div className="absolute left-0 top-full z-50 mt-2 min-w-[190px] rounded-xl border border-ink/10 bg-white py-1.5 shadow-[0_20px_44px_rgba(26,26,26,0.16)]">
                {item.children.map((sub) => (
                  <NavLink
                    key={sub.to}
                    to={sub.to}
                    onClick={() => setOpenLabel(null)}
                    className="block px-4 py-2.5 text-[14px] font-medium text-ink transition-colors hover:bg-ink/5 hover:text-accent"
                  >
                    {sub.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ) : (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={item.label === "Explore" ? handleExploreClick : undefined}
            className={linkClass}
          >
            {item.label}
          </NavLink>
        ),
      )}
    </nav>
  );
}
