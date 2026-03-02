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
        className="relative p-2 text-primary hover:text-primary-light transition-colors"
        aria-label={`Cart${totalItems > 0 ? `, ${totalItems} items` : ""}`}
      >
        <ShoppingCart className="h-5 w-5" />
        {totalItems > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        )}
      </button>

      <MiniCart isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
