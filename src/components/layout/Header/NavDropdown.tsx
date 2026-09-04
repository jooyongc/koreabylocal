import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";

export interface DropdownItem {
  label: string;
  href: string;
}

interface NavDropdownProps {
  label: string;
  href: string;
  items: DropdownItem[];
}

export default function NavDropdown({ label, href, items }: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const handleEnter = useCallback(() => {
    cancelClose();
    setOpen(true);
  }, [cancelClose]);

  const handleLeave = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }, []);

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <Link
        to={href}
        className="flex items-center gap-1 text-[14.5px] font-semibold tracking-[-0.01em] text-ink transition-colors hover:text-accent"
      >
        {label}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </Link>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 min-w-[190px] rounded-xl border border-ink/10 bg-white py-1.5 shadow-[0_20px_44px_rgba(26,26,26,0.16)]">
          {items.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="block px-4 py-2.5 text-[14px] font-medium text-ink transition-colors hover:bg-ink/5 hover:text-accent"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
