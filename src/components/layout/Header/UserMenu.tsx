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
        className="p-2 text-primary hover:text-primary-light transition-colors"
        aria-label="Sign in"
      >
        <User className="h-5 w-5" />
      </Link>
    );
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="p-2 text-primary hover:text-primary-light transition-colors"
        aria-label="Account menu"
        aria-expanded={open}
      >
        <CircleUser className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
          <div className="border-b border-gray-100 px-4 py-2">
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
