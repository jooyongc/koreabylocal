import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCartStore } from "@/stores/useCartStore";
import type { CartItem } from "@/stores/useCartStore";

function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function CartItemRow({ item }: { item: CartItem }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const subtotal = item.price * item.quantity;

  return (
    <>
      {/* Desktop row */}
      <tr className="hidden border-b border-gray-100 md:table-row">
        {/* Product */}
        <td className="py-4 pr-4">
          <div className="flex items-center gap-4">
            <Link
              to={`/product/${item.slug}`}
              className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-background-gray"
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
                  <ShoppingBag className="h-8 w-8" />
                </div>
              )}
            </Link>
            <div className="min-w-0">
              <Link
                to={`/product/${item.slug}`}
                className="text-sm font-semibold text-primary hover:text-primary-light"
              >
                {item.title}
              </Link>
              {item.selectedOptions && (
                <p className="mt-1 text-xs text-text-secondary">
                  {item.selectedOptions}
                </p>
              )}
            </div>
          </div>
        </td>

        {/* Unit price */}
        <td className="py-4 pr-4 text-sm text-text-secondary">
          {formatPrice(item.price)}
        </td>

        {/* Quantity */}
        <td className="py-4 pr-4">
          <div className="inline-flex items-center rounded-lg border border-gray-200">
            <button
              onClick={() =>
                updateQuantity(item.id, Math.max(1, item.quantity - 1))
              }
              className="flex h-8 w-8 items-center justify-center text-text-secondary hover:text-primary"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="flex h-8 w-10 items-center justify-center text-sm font-medium">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="flex h-8 w-8 items-center justify-center text-text-secondary hover:text-primary"
              aria-label="Increase quantity"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>

        {/* Subtotal */}
        <td className="py-4 pr-4 text-sm font-semibold text-primary">
          {formatPrice(subtotal)}
        </td>

        {/* Remove */}
        <td className="py-4">
          <button
            onClick={() => removeItem(item.id)}
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-red-50 hover:text-red-500"
            aria-label="Remove item"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </td>
      </tr>

      {/* Mobile card */}
      <div className="flex gap-3 border-b border-gray-100 py-4 md:hidden">
        <Link
          to={`/product/${item.slug}`}
          className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-background-gray"
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
              <ShoppingBag className="h-8 w-8" />
            </div>
          )}
        </Link>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                to={`/product/${item.slug}`}
                className="text-sm font-semibold text-primary hover:text-primary-light"
              >
                {item.title}
              </Link>
              {item.selectedOptions && (
                <p className="mt-0.5 text-xs text-text-secondary">
                  {item.selectedOptions}
                </p>
              )}
            </div>
            <button
              onClick={() => removeItem(item.id)}
              className="shrink-0 rounded p-1 text-text-secondary hover:text-red-500"
              aria-label="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className="inline-flex items-center rounded-lg border border-gray-200">
              <button
                onClick={() =>
                  updateQuantity(item.id, Math.max(1, item.quantity - 1))
                }
                className="flex h-7 w-7 items-center justify-center text-text-secondary hover:text-primary"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="flex h-7 w-8 items-center justify-center text-xs font-medium">
                {item.quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="flex h-7 w-7 items-center justify-center text-text-secondary hover:text-primary"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <span className="text-sm font-semibold text-primary">
              {formatPrice(subtotal)}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice());
  const totalItems = useCartStore((s) => s.totalItems());
  const clearCart = useCartStore((s) => s.clearCart);

  return (
    <>
      <Helmet>
        <title>Cart | Korea By Local</title>
        <meta
          name="description"
          content="Review your shopping cart before checkout."
        />
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-8 lg:py-12">
        <h1 className="text-2xl font-bold text-primary lg:text-3xl">
          Shopping Cart
        </h1>

        {items.length === 0 ? (
          /* Empty state */
          <div className="mt-16 flex flex-col items-center py-12 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-background-gray">
              <ShoppingBag className="h-12 w-12 text-text-secondary/40" />
            </div>
            <h2 className="mt-6 text-lg font-semibold text-primary">
              Your cart is empty
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Looks like you haven&apos;t added anything to your cart yet.
            </p>
            <Link
              to="/shop"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
            >
              Continue Shopping
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            {/* Items */}
            <div className="lg:col-span-2">
              {/* Desktop table */}
              <table className="hidden w-full md:table">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                    <th className="pb-3 pr-4">Product</th>
                    <th className="pb-3 pr-4">Price</th>
                    <th className="pb-3 pr-4">Quantity</th>
                    <th className="pb-3 pr-4">Subtotal</th>
                    <th className="pb-3 w-12" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <CartItemRow key={item.id} item={item} />
                  ))}
                </tbody>
              </table>

              {/* Mobile cards */}
              <div className="md:hidden">
                {items.map((item) => (
                  <CartItemRow key={item.id} item={item} />
                ))}
              </div>

              {/* Clear cart */}
              <div className="mt-6 flex items-center justify-between">
                <Link
                  to="/shop"
                  className="text-sm font-medium text-accent hover:underline"
                >
                  Continue Shopping
                </Link>
                <button
                  onClick={clearCart}
                  className="text-sm font-medium text-text-secondary hover:text-red-500"
                >
                  Clear Cart
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="text-lg font-bold text-primary">
                  Order Summary
                </h2>

                <div className="mt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">
                      Subtotal ({totalItems} item
                      {totalItems !== 1 && "s"})
                    </span>
                    <span className="font-medium text-primary">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Shipping</span>
                    <span className="font-medium text-text-secondary">
                      Calculated at checkout
                    </span>
                  </div>
                </div>

                <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <span className="text-base font-bold text-primary">
                      Total
                    </span>
                    <span className="text-base font-bold text-primary">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                </div>

                <Link
                  to="/checkout"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                >
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
