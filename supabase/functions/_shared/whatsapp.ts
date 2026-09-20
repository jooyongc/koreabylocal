// Notifies the team on WhatsApp through the Meta Cloud API. Used alongside the
// admin email so a paid question reaches someone's phone immediately.
//
// Every recipient in WHATSAPP_TO is messaged at once, in parallel, and one
// number failing never stops the others — two people on call means either can
// pick the question up.
//
// REQUIRED secrets: WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN,
// WHATSAPP_TO (comma-separated, international format, e.g. "821012345678,821098765432").
// Optional: WHATSAPP_TEMPLATE_NAME + WHATSAPP_TEMPLATE_LANG (default "en"),
// WHATSAPP_API_VERSION (default v21.0).
//
// A plain text message only reaches someone who messaged the business number in
// the last 24 hours. For a notification that must always land, set
// WHATSAPP_TEMPLATE_NAME to an approved template whose body takes the variables
// this module passes. Without it we still try text, which is fine while the
// team keeps the thread warm.

const API_VERSION = () => Deno.env.get("WHATSAPP_API_VERSION") || "v21.0";

export function isWhatsAppConfigured(): boolean {
  return Boolean(
    Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") &&
      Deno.env.get("WHATSAPP_ACCESS_TOKEN") &&
      recipients().length > 0,
  );
}

/** Digits only — the Cloud API rejects "+", spaces and dashes. */
export function recipients(): string[] {
  return (Deno.env.get("WHATSAPP_TO") ?? "")
    .split(",")
    .map((n) => n.replace(/[^0-9]/g, ""))
    .filter((n) => n.length >= 8);
}

export interface SendOptions {
  /** Ordered values for an approved template's body placeholders. */
  templateParams?: string[];
  fetch?: typeof fetch;
  timeoutMs?: number;
}

export interface DeliveryResult {
  to: string;
  ok: boolean;
  error?: string;
}

function buildPayload(to: string, text: string, params: string[] | undefined) {
  const template = Deno.env.get("WHATSAPP_TEMPLATE_NAME");
  if (template) {
    return {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: template,
        language: { code: Deno.env.get("WHATSAPP_TEMPLATE_LANG") || "en" },
        components: params?.length
          ? [{ type: "body", parameters: params.map((t) => ({ type: "text", text: t })) }]
          : [],
      },
    };
  }
  return {
    messaging_product: "whatsapp",
    to,
    type: "text",
    // Link previews would push the message body out of the notification.
    text: { preview_url: false, body: text },
  };
}

/**
 * Sends to every configured number at once. Never throws — the caller is a
 * payment webhook and a missed notification must not fail a paid order.
 */
export async function notifyTeam(text: string, opts: SendOptions = {}): Promise<DeliveryResult[]> {
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const to = recipients();
  if (!phoneNumberId || !token || to.length === 0) return [];

  const doFetch = opts.fetch ?? fetch;
  const timeoutMs = opts.timeoutMs ?? 5_000;
  const url = `https://graph.facebook.com/${API_VERSION()}/${phoneNumberId}/messages`;

  // Parallel on purpose: both phones should buzz together, and one slow or
  // blocked number must not delay the other.
  return await Promise.all(
    to.map(async (number): Promise<DeliveryResult> => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await doFetch(url, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload(number, text, opts.templateParams)),
          signal: controller.signal,
        });
        if (res.ok) return { to: number, ok: true };
        const detail = (await res.text().catch(() => "")).slice(0, 200);
        console.error(`whatsapp: ${number} failed (${res.status}): ${detail}`);
        return { to: number, ok: false, error: `${res.status}: ${detail}` };
      } catch (e) {
        const err = e as Error;
        const reason = err.name === "AbortError" ? `no response within ${timeoutMs}ms` : err.message;
        console.error(`whatsapp: ${number} failed: ${reason}`);
        return { to: number, ok: false, error: reason };
      } finally {
        clearTimeout(timer);
      }
    }),
  );
}
