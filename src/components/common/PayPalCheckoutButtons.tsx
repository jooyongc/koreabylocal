import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { usePayPalScript } from "@/hooks/usePayPalScript";

interface PayPalCheckoutButtonsProps {
  amount: number;
  description: string;
  /** Called with the captured PayPal order id. The caller MUST still verify it server-side before granting anything. */
  onApproved: (paypalOrderId: string) => void;
  onError?: () => void;
  disabled?: boolean;
}

/**
 * Renders PayPal's hosted payment buttons for a one-time charge. The capture
 * itself happens client-side (talking directly to PayPal — a script running
 * in the page cannot forge a completed payment), but the amount actually
 * received must always be re-checked server-side before anything is unlocked.
 */
export default function PayPalCheckoutButtons({
  amount,
  description,
  onApproved,
  onError,
  disabled,
}: PayPalCheckoutButtonsProps) {
  const { ready, configured } = usePayPalScript();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<{ close: () => Promise<void> } | null>(null);

  useEffect(() => {
    if (!ready || disabled || !window.paypal || !containerRef.current) return;

    containerRef.current.innerHTML = "";

    const buttons = window.paypal.Buttons({
      style: { layout: "vertical", color: "gold", shape: "rect", label: "pay" },
      createOrder: (_data, actions) =>
        actions.order.create({
          purchase_units: [{ amount: { value: amount.toFixed(2), currency_code: "USD" }, description }],
        }),
      onApprove: async (_data, actions) => {
        const captured = await actions.order.capture();
        onApproved(captured.id);
      },
      onError: () => onError?.(),
    });

    buttonsRef.current = buttons;
    buttons.render(containerRef.current);

    return () => {
      buttonsRef.current?.close().catch(() => {});
      buttonsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onApproved/onError are expected to be stable per render pass
  }, [ready, disabled, amount, description]);

  if (!configured) {
    return <p className="text-[13.5px] text-coral">Payments aren't set up yet — please check back soon.</p>;
  }
  if (!ready || disabled) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-3" />
      </div>
    );
  }
  return <div ref={containerRef} />;
}
