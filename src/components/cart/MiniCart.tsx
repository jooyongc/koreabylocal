import { Link } from "react-router-dom";
import { X, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import { useCartStore } from "@/stores/useCartStore";

function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface MiniCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MiniCart({ isOpen, onClose }: MiniCartProps) {
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice());
  const totalItems = useCartStore((s) => s.totalItems());
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <span className="text-lg font-bold text-primary">
            Cart ({totalItems})
          </span>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-primary transition-colors hover:text-primary-light"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background-gray">
              <ShoppingBag className="h-8 w-8 text-text-secondary/40" />
            </div>
            <p className="mt-4 text-sm font-medium text-primary">
              Your cart is empty
            </p>
            <Link
              to="/shop"
              onClick={onClose}
              className="mt-4 text-sm font-medium text-accent hover:underline"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            <div
              className="flex-1 overflow-y-auto px-4 py-3"
              style={{ maxHeight: "calc(100vh - 200px)" }}
            >
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 rounded-lg border border-gray-100 p-3"
                  >
                    {/* Thumbnail */}
                    <Link
                      to={`/product/${item.slug}`}
                      onClick={onClose}
                      className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-background-gray"
                    >
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-text-secondary/40">
                          <ShoppingBag className="h-6 w-6" />
                        </div>
                      )}
                    </Link>

                    {/* Info */}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/product/${item.slug}`}
                          onClick={onClose}
                          className="line-clamp-1 text-xs font-semibold text-primary hover:text-primary-light"
                        >
                          {item.title}
                        </Link>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="shrink-0 text-text-secondary hover:text-red-500"
                          aria-label="Remove"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {item.selectedOptions && (
                        <p className="text-[10px] text-text-secondary">
                          {item.selectedOptions}
                        </p>
                      )}

                      <div className="mt-auto flex items-center justify-between pt-1">
                        <div className="inline-flex items-center rounded border border-gray-200">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                Math.max(1, item.quantity - 1)
                              )
                            }
                            className="flex h-6 w-6 items-center justify-center text-text-secondary hover:text-primary"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="flex h-6 w-7 items-center justify-center text-[11px] font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="flex h-6 w-6 items-center justify-center text-text-secondary hover:text-primary"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-xs font-semibold text-primary">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-4 py-4">
              <div className="mb-4 flex justify-between">
                <span className="text-sm font-medium text-text-secondary">
                  Total
                </span>
                <span className="text-base font-bold text-primary">
                  {formatPrice(totalPrice)}
                </span>
              </div>

              <div className="flex gap-3">
                <Link
                  to="/cart"
                  onClick={onClose}
                  className="flex flex-1 items-center justify-center rounded-lg border border-primary py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                >
                  View Cart
                </Link>
                <Link
                  to="/checkout"
                  onClick={onClose}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                >
                  Checkout
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
