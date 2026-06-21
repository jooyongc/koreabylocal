import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  FileText,
  ShoppingCart,
  BookOpen,
  MessageSquare,
  Settings,
  Sparkles,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/content-studio", icon: Sparkles, label: "Content Studio", accent: true },
  { to: "/admin/products", icon: Package, label: "Products" },
  { to: "/admin/blog", icon: FileText, label: "Blog" },
  { to: "/admin/orders", icon: ShoppingCart, label: "Orders" },
  { to: "/admin/inquiries", icon: MessageSquare, label: "Inquiries" },
  { to: "/admin/magazines", icon: BookOpen, label: "Magazines" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
];

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-ink/40 lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 bg-ink text-white transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <Link to="/admin" className="flex items-baseline gap-[2px]" onClick={onClose}>
            <span className="font-display text-[19px] font-extrabold">Korea</span>
            <span className="font-serif-accent px-[2px] text-[16px] italic">by</span>
            <span className="font-display text-[19px] font-extrabold text-accent">Local</span>
            <span className="ml-1.5 self-center rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white/60">
              Admin
            </span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {NAV_ITEMS.map(({ to, icon: Icon, label, end, accent }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-white/12 text-white"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    }`
                  }
                >
                  <Icon className={`h-5 w-5 shrink-0 ${accent ? "text-accent" : ""}`} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-white/10 px-5 py-4 text-[11px] text-white/40">
          Korea by Local · Admin
        </div>
      </aside>
    </>
  );
}
