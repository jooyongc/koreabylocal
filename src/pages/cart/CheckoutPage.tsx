import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ShoppingBag, Loader2, Lock, ShieldCheck, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "@/stores/useCartStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { supabase } from "@/lib/supabase";
import PageSEO from "@/components/common/PageSEO";
import CheckoutSteps from "@/components/cart/CheckoutSteps";

interface CheckoutFormData {
  email: string;
  name: string;
  phoneCode: string;
  phone: string;
  note: string;
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `KBL-${y}${m}${d}-${rand}`;
}

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID as
  | string
  | undefined;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice());
  const clearCart = useCartStore((s) => s.clearCart);
  const user = useAuthStore((s) => s.user);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paypalReady, setPaypalReady] = useState(false);
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const paypalButtonsRef = useRef<{ close: () => Promise<void> } | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors },
    setValue,
  } = useForm<CheckoutFormData>({
    defaultValues: {
      email: "",
      name: "",
      phoneCode: "+82",
      phone: "",
      note: "",
    },
  });

  // Auto-fill for logged-in users
  useEffect(() => {
    if (user) {
      setValue("email", user.email);
      if (user.name) setValue("name", user.name);
    }
  }, [user, setValue]);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate("/cart", { replace: true });
    }
  }, [items.length, navigate]);

  // Load PayPal SDK
  useEffect(() => {
    if (!PAYPAL_CLIENT_ID) return;
    if (window.paypal) {
      setPaypalReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`;
    script.async = true;
    script.onload = () => setPaypalReady(true);
    script.onerror = () =>
      toast.error("Failed to load PayPal. Please try again.");
    document.head.appendChild(script);

    return () => {
      // Don't remove script on cleanup - it's cached
    };
  }, []);

  const createOrder = useCallback(
    async (formData: CheckoutFormData) => {
      const orderNumber = generateOrderNumber();

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          user_id: user?.id ?? null,
          guest_email: user ? null : formData.email,
          guest_name: user ? null : formData.name,
          total_amount: totalPrice,
          currency: "USD",
          status: "pending",
          payment_status: "unpaid",
          payment_method: "paypal",
          customer_note: formData.note || null,
        })
        .select("id, order_number")
        .single();

      if (orderError || !order) {
        throw new Error(orderError?.message ?? "Failed to create order");
      }

      // Insert order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        product_title: item.title,
        quantity: item.quantity,
        unit_price: item.price,
        selected_options: item.selectedOptions
          ? JSON.parse(JSON.stringify(item.selectedOptions))
          : null,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        throw new Error(itemsError.message);
      }

      return order;
    },
    [items, totalPrice, user]
  );

  const handlePaypalPayment = useCallback(
    async (formData: CheckoutFormData) => {
      setIsSubmitting(true);
      try {
        const order = await createOrder(formData);

        // Update order to confirmed after PayPal payment
        await supabase
          .from("orders")
          .update({ payment_status: "paid", status: "confirmed" })
          .eq("id", order.id);

        clearCart();
        navigate(`/order/confirmation?orderNumber=${order.order_number}`, {
          replace: true,
        });
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to process order"
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [createOrder, clearCart, navigate]
  );

  // Render PayPal buttons
  useEffect(() => {
    if (!paypalReady || !window.paypal || !paypalContainerRef.current) return;
    if (items.length === 0) return;

    // Clear previous buttons
    if (paypalButtonsRef.current) {
      paypalButtonsRef.current.close().catch(() => {});
    }
    if (paypalContainerRef.current) {
      paypalContainerRef.current.innerHTML = "";
    }

    const buttons = window.paypal.Buttons({
      style: {
        layout: "vertical",
        color: "gold",
        shape: "rect",
        label: "paypal",
      },
      createOrder: (_data, actions) => {
        return actions.order.create({
          purchase_units: [
            {
              amount: {
                value: totalPrice.toFixed(2),
                currency_code: "USD",
              },
              description: `Korea By Local Order (${items.length} items)`,
            },
          ],
        });
      },
      onApprove: async (_data, actions) => {
        await actions.order.capture();
        // Validate form before processing
        const valid = await trigger();
        if (!valid) {
          toast.error("Please fill in all required fields.");
          return;
        }
        const formData = getValues();
        await handlePaypalPayment(formData);
      },
      onError: () => {
        toast.error("PayPal payment failed. Please try again.");
      },
      onCancel: () => {
        toast("Payment cancelled.", { icon: "ℹ️" });
      },
    });

    paypalButtonsRef.current = buttons;
    buttons.render(paypalContainerRef.current);

    return () => {
      paypalButtonsRef.current = null;
    };
  }, [
    paypalReady,
    totalPrice,
    items.length,
    items,
    trigger,
    getValues,
    handlePaypalPayment,
  ]);

  // Fallback: manual order for when PayPal SDK isn't configured
  const onSubmitManual = handleSubmit(async (formData) => {
    setIsSubmitting(true);
    try {
      const order = await createOrder(formData);
      clearCart();
      navigate(`/order/confirmation?orderNumber=${order.order_number}`, {
        replace: true,
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to process order"
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  if (items.length === 0) return null;

  return (
    <>
      <PageSEO
        title="Secure checkout | Korea By Local"
        description="Complete your purchase securely."
        path="/checkout"
        noindex
      />

      <div className="bg-paper">
        <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6 lg:pt-12">
          {/* Heading + step indicator */}
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Secure checkout
          </h1>
          <div className="mt-6">
            <CheckoutSteps current={2} />
          </div>
        </div>

        <div className="mx-auto flex max-w-5xl flex-col items-start gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:gap-10 lg:py-10">
          {/* Left column: contact, traveller, payment */}
          <div className="flex w-full flex-col gap-5 lg:flex-[3]">
            {/* Contact details */}
            <section className="rounded-[18px] bg-white p-6 shadow-[0_8px_26px_rgba(16,15,44,0.06)]">
              <h2 className="mb-4 font-display text-lg font-bold text-ink">
                Contact details
              </h2>

              {!user && (
                <p className="mb-4 text-sm text-muted">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-accent hover:underline"
                  >
                    Log in
                  </Link>
                </p>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-xs font-semibold text-muted-2"
                  >
                    Email <span className="text-accent">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Please enter a valid email address",
                      },
                    })}
                    className={`w-full rounded-[11px] border bg-white px-3.5 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted-3 focus:ring-2 ${
                      errors.email
                        ? "border-coral focus:border-coral focus:ring-coral/20"
                        : "border-ink/15 focus:border-ink focus:ring-ink/10"
                    }`}
                    placeholder="your@email.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-coral">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="mb-1.5 block text-xs font-semibold text-muted-2"
                  >
                    Phone{" "}
                    <span className="font-medium text-muted-3">
                      (for your host · optional)
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      {...register("phoneCode")}
                      className="w-24 rounded-[11px] border border-ink/15 bg-white px-2 py-3 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
                    >
                      <option value="+82">+82</option>
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                      <option value="+81">+81</option>
                      <option value="+86">+86</option>
                      <option value="+61">+61</option>
                      <option value="+49">+49</option>
                      <option value="+33">+33</option>
                    </select>
                    <input
                      id="phone"
                      type="tel"
                      {...register("phone")}
                      className="flex-1 rounded-[11px] border border-ink/15 bg-white px-3.5 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted-3 focus:border-ink focus:ring-2 focus:ring-ink/10"
                      placeholder="010-1234-5678"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Lead traveller */}
            <section className="rounded-[18px] bg-white p-6 shadow-[0_8px_26px_rgba(16,15,44,0.06)]">
              <h2 className="mb-4 font-display text-lg font-bold text-ink">
                Lead traveller
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Full name */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1.5 block text-xs font-semibold text-muted-2"
                  >
                    Full name <span className="text-accent">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    {...register("name", {
                      required: "Name is required",
                    })}
                    className={`w-full rounded-[11px] border bg-white px-3.5 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted-3 focus:ring-2 ${
                      errors.name
                        ? "border-coral focus:border-coral focus:ring-coral/20"
                        : "border-ink/15 focus:border-ink focus:ring-ink/10"
                    }`}
                    placeholder="Your name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-coral">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Order note */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="note"
                    className="mb-1.5 block text-xs font-semibold text-muted-2"
                  >
                    Order note{" "}
                    <span className="font-medium text-muted-3">(optional)</span>
                  </label>
                  <textarea
                    id="note"
                    rows={3}
                    {...register("note")}
                    className="w-full rounded-[11px] border border-ink/15 bg-white px-3.5 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted-3 focus:border-ink focus:ring-2 focus:ring-ink/10"
                    placeholder="Any special requests or notes for your host..."
                  />
                </div>
              </div>
            </section>

            {/* Payment method */}
            <section className="rounded-[18px] bg-white p-6 shadow-[0_8px_26px_rgba(16,15,44,0.06)]">
              <h2 className="mb-4 font-display text-lg font-bold text-ink">
                Payment method
              </h2>

              {PAYPAL_CLIENT_ID ? (
                <div>
                  {/* Recommended PayPal option */}
                  <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[13px] border-2 border-accent bg-accent/5 px-4 py-4">
                    <span
                      aria-hidden="true"
                      className="h-5 w-5 shrink-0 rounded-full border-[6px] border-accent"
                    />
                    <span className="font-display text-lg font-extrabold italic text-[#003087]">
                      Pay<span className="text-[#009cde]">Pal</span>
                    </span>
                    <span className="text-sm text-muted">
                      Pay with your PayPal balance, bank or card
                    </span>
                    <span className="ml-auto rounded-full bg-green/10 px-2.5 py-1 text-[11px] font-bold text-green">
                      Recommended
                    </span>
                  </div>

                  {!paypalReady ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-2" />
                      <span className="ml-2 text-sm text-muted-2">
                        Loading PayPal...
                      </span>
                    </div>
                  ) : (
                    <div ref={paypalContainerRef} />
                  )}

                  <div className="mt-4 flex items-center gap-2 text-[12.5px] text-muted-2">
                    <Lock className="h-3.5 w-3.5 shrink-0" />
                    Encrypted &amp; PCI-DSS compliant. You&apos;ll confirm on
                    PayPal&apos;s secure page.
                  </div>
                </div>
              ) : (
                <div>
                  <p className="mb-4 text-sm text-muted">
                    Your order will be submitted and we&apos;ll contact you to
                    arrange payment.
                  </p>
                  <button
                    onClick={onSubmitManual}
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-[13px] bg-ink py-4 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Place Order — ${formatPrice(totalPrice)}`
                    )}
                  </button>
                  <div className="mt-4 flex items-center gap-2 text-[12.5px] text-muted-2">
                    <Lock className="h-3.5 w-3.5 shrink-0" />
                    Encrypted &amp; PCI-DSS compliant.
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Right column: order summary */}
          <aside className="w-full lg:sticky lg:top-[88px] lg:flex-[2]">
            <div className="rounded-[20px] bg-white p-6 shadow-[0_16px_44px_rgba(16,15,44,0.12)]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-ink">
                  Order summary
                </h2>
                <Link
                  to="/cart"
                  className="text-xs font-semibold text-accent hover:underline"
                >
                  Edit cart
                </Link>
              </div>

              {/* Items */}
              <div className="max-h-80 space-y-4 overflow-y-auto border-b border-ink/10 pb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative h-[58px] w-[58px] shrink-0 overflow-hidden rounded-xl bg-cream-200">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-3">
                          <ShoppingBag className="h-5 w-5" />
                        </div>
                      )}
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold text-white">
                        {item.quantity}
                      </span>
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                      <p className="line-clamp-2 font-display text-[14.5px] font-bold leading-tight text-ink">
                        {item.title}
                      </p>
                      {item.selectedOptions && (
                        <p className="mt-1 text-xs text-muted-2">
                          {item.selectedOptions}
                        </p>
                      )}
                    </div>

                    <span className="shrink-0 self-center text-sm font-semibold text-ink">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Promo (visual only — matches design) */}
              <div className="my-4 flex items-center gap-2 rounded-[11px] bg-paper px-3.5 py-3">
                <span aria-hidden="true" className="text-muted-3">
                  🎟
                </span>
                <span className="flex-1 text-sm text-muted-3">Promo code</span>
                <span className="text-sm font-bold text-accent">Apply</span>
              </div>

              {/* Totals */}
              <div className="mb-4 flex flex-col gap-2.5 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Service fee</span>
                  <span>{formatPrice(0)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between border-t border-ink/10 pt-3 font-display text-xl font-extrabold text-ink">
                  <span>Total</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
              </div>

              {/* Pay button: PayPal SDK buttons or manual fallback */}
              {PAYPAL_CLIENT_ID ? (
                !paypalReady ? (
                  <div className="flex items-center justify-center rounded-[13px] bg-cream-200 py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-2" />
                    <span className="ml-2 text-sm text-muted-2">
                      Loading PayPal...
                    </span>
                  </div>
                ) : (
                  <p className="text-center text-xs text-muted-2">
                    Continue with PayPal in the Payment section above to pay{" "}
                    <span className="font-bold text-ink">
                      {formatPrice(totalPrice)}
                    </span>
                    .
                  </p>
                )
              ) : (
                <button
                  onClick={onSubmitManual}
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-[13px] bg-gold py-4 text-base font-extrabold italic text-ink shadow-[0_10px_24px_rgba(242,183,5,0.4)] transition-opacity hover:opacity-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Place order · Pay ${formatPrice(totalPrice)}`
                  )}
                </button>
              )}

              {/* Trust note */}
              <div className="mt-4 flex items-center justify-center gap-1.5 text-[11.5px] text-muted-2">
                <Lock className="h-3 w-3" />
                256-bit SSL · No card details stored
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-muted-2">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Verified hosts
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <RotateCcw className="h-3 w-3" /> 24h refund
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
