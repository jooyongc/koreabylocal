import { useState, useEffect, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ShoppingBag, ChevronRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "@/stores/useCartStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { supabase } from "@/lib/supabase";

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
      <Helmet>
        <title>Checkout | Korea By Local</title>
        <meta
          name="description"
          content="Complete your purchase securely."
        />
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-8 lg:py-12">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-text-secondary">
          <Link to="/cart" className="hover:text-primary">
            Cart
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-primary">Checkout</span>
        </nav>

        <h1 className="mb-8 text-2xl font-bold text-primary lg:text-3xl">
          Checkout
        </h1>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Contact Information */}
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-bold text-primary">
                Contact Information
              </h2>

              {!user && (
                <p className="mb-4 text-sm text-text-secondary">
                  Already have an account?{" "}
                  <Link to="/login" className="font-medium text-accent hover:underline">
                    Log in
                  </Link>
                </p>
              )}

              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1 block text-sm font-medium text-primary"
                  >
                    Email <span className="text-red-500">*</span>
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
                    className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-1 ${
                      errors.email
                        ? "border-red-400 focus:border-red-400 focus:ring-red-400"
                        : "border-gray-200 focus:border-primary focus:ring-primary"
                    }`}
                    placeholder="your@email.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1 block text-sm font-medium text-primary"
                  >
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    {...register("name", {
                      required: "Name is required",
                    })}
                    className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-1 ${
                      errors.name
                        ? "border-red-400 focus:border-red-400 focus:ring-red-400"
                        : "border-gray-200 focus:border-primary focus:ring-primary"
                    }`}
                    placeholder="Your name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="mb-1 block text-sm font-medium text-primary"
                  >
                    Phone{" "}
                    <span className="text-text-secondary font-normal">
                      (optional)
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      {...register("phoneCode")}
                      className="w-24 rounded-lg border border-gray-200 px-2 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
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
                      className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="010-1234-5678"
                    />
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label
                    htmlFor="note"
                    className="mb-1 block text-sm font-medium text-primary"
                  >
                    Order Note{" "}
                    <span className="text-text-secondary font-normal">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    id="note"
                    rows={3}
                    {...register("note")}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Any special requests or notes..."
                  />
                </div>
              </div>
            </section>

            {/* Payment */}
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-bold text-primary">Payment</h2>

              {PAYPAL_CLIENT_ID ? (
                <div>
                  <p className="mb-4 text-sm text-text-secondary">
                    Complete your payment securely with PayPal.
                  </p>
                  {!paypalReady ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-text-secondary" />
                      <span className="ml-2 text-sm text-text-secondary">
                        Loading PayPal...
                      </span>
                    </div>
                  ) : (
                    <div ref={paypalContainerRef} />
                  )}
                </div>
              ) : (
                <div>
                  <p className="mb-4 text-sm text-text-secondary">
                    Your order will be submitted and we&apos;ll contact you to
                    arrange payment.
                  </p>
                  <button
                    onClick={onSubmitManual}
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
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
                </div>
              )}
            </section>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-primary">
                  Order Summary
                </h2>
                <Link
                  to="/cart"
                  className="text-xs font-medium text-accent hover:underline"
                >
                  Edit Cart
                </Link>
              </div>

              {/* Items */}
              <div className="max-h-80 space-y-3 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-background-gray">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-text-secondary/40">
                          <ShoppingBag className="h-5 w-5" />
                        </div>
                      )}
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-text-secondary px-1 text-[10px] font-bold text-white">
                        {item.quantity}
                      </span>
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                      <p className="line-clamp-1 text-sm font-medium text-primary">
                        {item.title}
                      </p>
                      {item.selectedOptions && (
                        <p className="text-[10px] text-text-secondary">
                          {item.selectedOptions}
                        </p>
                      )}
                    </div>

                    <span className="shrink-0 self-center text-sm font-medium text-primary">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-4 space-y-2 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="font-medium text-primary">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Shipping</span>
                  <span className="text-text-secondary">Free</span>
                </div>
              </div>

              <div className="mt-3 border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-base font-bold text-primary">
                    Total
                  </span>
                  <span className="text-base font-bold text-primary">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
