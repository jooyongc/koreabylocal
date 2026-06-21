import { Link } from "react-router-dom";
import { Search } from "lucide-react";
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
            to="/blog"
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
