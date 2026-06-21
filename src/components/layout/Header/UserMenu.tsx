import { useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, CircleUser, Settings, ShoppingBag, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useClickOutside } from "@/hooks/useClickOutside";

export default function UserMenu() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, useCallback(() => setOpen(false), []));

  if (!user) {
    return (
      <Link
        to="/login"
        className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-ink/5 text-ink transition-colors hover:bg-ink/10"
        aria-label="Sign in"
      >
        <User className="h-[18px] w-[18px]" />
      </Link>
    );
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-ink/5 text-ink transition-colors hover:bg-ink/10"
        aria-label="Account menu"
        aria-expanded={open}
      >
        <CircleUser className="h-[18px] w-[18px]" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-2xl border border-ink/10 bg-white py-1 shadow-[0_16px_44px_rgba(16,15,44,0.16)]">
          <div className="border-b border-ink/10 px-4 py-2.5">
            <p className="text-sm font-medium text-primary truncate">
              {user.name ?? user.email}
            </p>
          </div>
          <Link
            to="/account"
            className="flex items-center gap-2 px-4 py-2 text-sm text-text hover:bg-background-gray transition-colors"
            onClick={() => setOpen(false)}
          >
            <Settings className="h-4 w-4" />
            My Account
          </Link>
          <Link
            to="/account/orders"
            className="flex items-center gap-2 px-4 py-2 text-sm text-text hover:bg-background-gray transition-colors"
            onClick={() => setOpen(false)}
          >
            <ShoppingBag className="h-4 w-4" />
            My Orders
          </Link>
          <button
            onClick={async () => {
              setOpen(false);
              await signOut();
              navigate("/");
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-text hover:bg-background-gray transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
