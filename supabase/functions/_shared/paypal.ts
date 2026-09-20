// PayPal Orders v2, server side. The browser is never trusted to say a payment
// happened — it only hands back an order id, and we ask PayPal ourselves.
//
// Redirect flow, which is what the Ask a Local checkout needs:
//   createOrder() → send the buyer to approveUrl → PayPal returns them to
//   returnUrl?token=<orderId> → captureOrder(orderId) takes the money.
//
// REQUIRED secrets: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET.
// Optional: PAYPAL_ENV=live|sandbox (default live, matching verify-paypal-order).

const ENV = () => (Deno.env.get("PAYPAL_ENV") ?? "live").toLowerCase();
const base = () => (ENV() === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com");

export function isPayPalConfigured(): boolean {
  return Boolean(Deno.env.get("PAYPAL_CLIENT_ID") && Deno.env.get("PAYPAL_CLIENT_SECRET"));
}

export interface PayPalOptions {
  /** Injected by tests. */
  fetch?: typeof fetch;
}

// Access tokens last ~9h; reuse one across invocations of a warm worker.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(doFetch: typeof fetch): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const id = Deno.env.get("PAYPAL_CLIENT_ID");
  const secret = Deno.env.get("PAYPAL_CLIENT_SECRET");
  if (!id || !secret) throw new Error("paypal_not_configured");

  const res = await doFetch(`${base()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${btoa(`${id}:${secret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(`paypal_auth_failed (${res.status})`);
  }
  cachedToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 32000) * 1000 };
  return cachedToken.value;
}

/** Only for tests — a cached token would otherwise leak between cases. */
export function _resetTokenCache() {
  cachedToken = null;
}

export interface CreateOrderInput {
  amount: string;
  currency: string;
  description: string;
  /** Our own id for the thing being paid for, echoed back on capture. */
  referenceId: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface CreatedOrder {
  id: string;
  approveUrl: string;
}

export async function createOrder(input: CreateOrderInput, opts: PayPalOptions = {}): Promise<CreatedOrder> {
  const doFetch = opts.fetch ?? fetch;
  const token = await accessToken(doFetch);

  const res = await doFetch(`${base()}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        reference_id: input.referenceId,
        // PayPal caps this at 127 characters and rejects some punctuation.
        description: input.description.replace(/[|&<>"']/g, "").slice(0, 127),
        amount: { currency_code: input.currency, value: input.amount },
      }],
      payment_source: {
        paypal: {
          experience_context: {
            user_action: "PAY_NOW",
            return_url: input.returnUrl,
            cancel_url: input.cancelUrl,
          },
        },
      },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.id) {
    throw new Error(`paypal_create_failed (${res.status}): ${JSON.stringify(data).slice(0, 200)}`);
  }

  const approveUrl = (data.links ?? []).find((l: { rel: string }) => l.rel === "payer-action" || l.rel === "approve")?.href;
  if (!approveUrl) throw new Error("paypal_no_approve_url");

  return { id: data.id, approveUrl };
}

export interface CaptureResult {
  ok: boolean;
  status: string;
  /** Our reference_id from createOrder — the only thing we trust to say what was paid for. */
  referenceId: string | null;
  amount: string | null;
  currency: string | null;
  captureId: string | null;
  payerEmail: string | null;
}

/**
 * Takes the money. Safe to call twice: PayPal answers an already-captured order
 * with ORDER_ALREADY_CAPTURED, which we read back as the completed order rather
 * than an error, so a buyer refreshing the return page cannot break anything.
 */
export async function captureOrder(orderId: string, opts: PayPalOptions = {}): Promise<CaptureResult> {
  const doFetch = opts.fetch ?? fetch;
  const token = await accessToken(doFetch);

  const res = await doFetch(`${base()}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  let data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const alreadyCaptured = JSON.stringify(data).includes("ORDER_ALREADY_CAPTURED");
    if (!alreadyCaptured) {
      return { ok: false, status: `http_${res.status}`, referenceId: null, amount: null, currency: null, captureId: null, payerEmail: null };
    }
    const lookup = await doFetch(`${base()}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    data = await lookup.json().catch(() => ({}));
    if (!lookup.ok) {
      return { ok: false, status: `http_${lookup.status}`, referenceId: null, amount: null, currency: null, captureId: null, payerEmail: null };
    }
  }

  const unit = data.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];

  return {
    ok: data.status === "COMPLETED",
    status: String(data.status ?? "unknown"),
    referenceId: unit?.reference_id ?? null,
    amount: capture?.amount?.value ?? unit?.amount?.value ?? null,
    currency: capture?.amount?.currency_code ?? unit?.amount?.currency_code ?? null,
    captureId: capture?.id ?? null,
    payerEmail: data.payer?.email_address ?? null,
  };
}
