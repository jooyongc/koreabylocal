import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface FooterColumnProps {
  title: string;
  children: ReactNode;
}

export default function FooterColumn({ title, children }: FooterColumnProps) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {/* Desktop: always visible */}
      <h3 className="hidden md:block mb-4 text-sm font-semibold uppercase tracking-wider text-white/80">
        {title}
      </h3>
      <div className="hidden md:block">{children}</div>

      {/* Mobile: accordion */}
      <div className="md:hidden border-b border-white/10">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="flex w-full items-center justify-between py-3 text-sm font-semibold uppercase tracking-wider text-white/80"
        >
          {title}
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && <div className="pb-3">{children}</div>}
      </div>
    </div>
  );
}
