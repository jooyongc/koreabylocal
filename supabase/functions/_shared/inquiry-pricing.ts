// Price per Ask a Local service, looked up by the inquiry's `category`.
// Shared by create-inquiry-checkout (which charges it) and
// capture-inquiry-payment (which verifies the full price was actually paid),
// so the two can never drift apart.

const DEFAULT_PRICE = Deno.env.get("INQUIRY_PRICE_USD") || "1.00";

export const SERVICE_PRICES: Record<string, string> = {
  "General": DEFAULT_PRICE,
  "Restaurant Reservation": "1.00",
  "Schedule Check": "5.00",
  "Cosmetics Shipping": "5.00",
};

export function priceForCategory(category: string | null | undefined): string {
  return SERVICE_PRICES[category ?? ""] ?? DEFAULT_PRICE;
}
