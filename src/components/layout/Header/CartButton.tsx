import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/stores/useCartStore";
import MiniCart from "@/components/cart/MiniCart";

export default function CartButton() {
  const [isOpen, setIsOpen] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems());

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative flex h-[38px] w-[38px] items-center justify-center rounded-full bg-ink text-white transition-transform hover:scale-105"
        aria-label={`Cart${totalItems > 0 ? `, ${totalItems} items` : ""}`}
      >
        <ShoppingCart className="h-[17px] w-[17px]" />
        {totalItems > 0 && (
          <span className="absolute -top-[3px] -right-[3px] flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        )}
      </button>

      <MiniCart isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
