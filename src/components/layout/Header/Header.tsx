import { useScrollDirection } from "@/hooks/useScrollDirection";
import Logo from "./Logo";
import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";
import CartButton from "./CartButton";
import UserMenu from "./UserMenu";

export default function Header() {
  const { direction, pastThreshold } = useScrollDirection(200);

  const hidden = direction === "down" && pastThreshold;
  const shrink = pastThreshold;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 transition-all duration-300 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      } ${shrink ? "py-2 shadow-sm" : "py-4"}`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4">
        {/* Mobile: hamburger left */}
        <div className="flex items-center gap-2 lg:gap-0">
          <MobileNav />
          <Logo shrink={shrink} />
        </div>

        {/* Desktop: center nav */}
        <DesktopNav />

        {/* Actions: right */}
        <div className="flex items-center gap-1">
          <CartButton />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
