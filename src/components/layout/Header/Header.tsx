import { Link } from "react-router-dom";
import { Search, BookOpen } from "lucide-react";
import Logo from "./Logo";
import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";
import CartButton from "./CartButton";
import UserMenu from "./UserMenu";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Left: mobile menu + logo */}
        <div className="flex items-center gap-1">
          <MobileNav />
          <Logo />
        </div>

        {/* Center: nav */}
        <DesktopNav />

        {/* Right: actions */}
        <div className="flex items-center gap-1.5">
          <Link
            to="/ebook"
            aria-label="E-book"
            className="flex h-[38px] items-center gap-1.5 rounded-full bg-ink/5 px-3 text-ink transition-colors hover:bg-ink/10"
          >
            <BookOpen className="h-[18px] w-[18px]" />
            <span className="hidden text-[13.5px] font-semibold sm:inline">E-book</span>
            <span className="rounded-full bg-accent px-1.5 py-[1px] text-[9px] font-extrabold uppercase tracking-wide text-white">
              New
            </span>
          </Link>
          <Link
            to="/guidebook"
            aria-label="Search stories"
            className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-ink/5 text-ink transition-colors hover:bg-ink/10"
          >
            <Search className="h-[18px] w-[18px]" />
          </Link>
          <CartButton />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
