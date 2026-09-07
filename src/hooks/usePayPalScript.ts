import { useEffect, useState } from "react";

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined;
const SCRIPT_ID = "kbl-paypal-sdk";

/** Loads the PayPal JS SDK once per page and reports when `window.paypal` is ready to use. */
export function usePayPalScript() {
  const [ready, setReady] = useState(!!window.paypal);

  useEffect(() => {
    // Already resolved by the lazy initializer above, or PayPal isn't configured at all.
    if (!PAYPAL_CLIENT_ID || window.paypal) return;

    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", () => setReady(true));
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`;
    script.onload = () => setReady(true);
    document.head.appendChild(script);
  }, []);

  return { ready, configured: !!PAYPAL_CLIENT_ID };
}
