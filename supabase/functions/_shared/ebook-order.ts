// The e-book's PayPal order, shared by create-ebook-checkout (which opens it)
// and capture-ebook-payment (which takes the money and delivers the book).
//
// The order's reference_id is the only thing capture trusts to say which book
// was bought. It is prefixed so an Ask a Local order (whose reference_id is a
// bare inquiry id) can never be redeemed for a book, nor a book order for a
// question.

const PREFIX = "ebook-";

export const ebookReference = (ebookId: number): string => `${PREFIX}${ebookId}`;

export function parseEbookReference(ref: string | null | undefined): number | null {
  const m = /^ebook-(\d+)$/.exec(ref ?? "");
  const id = m ? Number(m[1]) : 0;
  return id > 0 ? id : null;
}

/** USD price as PayPal wants it: a string with exactly two decimals. */
export const priceString = (priceUsd: number | string): string => Number(priceUsd).toFixed(2);

/**
 * Whether what PayPal took covers the book's price. Checked at capture because
 * the order amount is set server-side but read back from PayPal, and currency
 * too, since PayPal will complete an order in another one.
 */
export function coversPrice(paid: { amount: string | null; currency: string | null }, priceUsd: number | string): boolean {
  if (paid.currency !== "USD" || paid.amount == null) return false;
  return Number(paid.amount) + 1e-9 >= Number(priceUsd);
}

export function generateDownloadToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// The title and the buyer's name are text we did not write.
const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export interface DeliveryEmailInput {
  title: string;
  buyerName: string | null;
  downloadUrl: string;
  maxDownloads: number;
  siteUrl: string;
  /** A $0 book claimed with an email address, not bought. */
  free?: boolean;
}

/**
 * The link email a reader gets the moment payment goes through — or, for a
 * free book, the moment they leave their email.
 */
export function buildDeliveryEmail(input: DeliveryEmailInput): { subject: string; html: string } {
  const firstName = (input.buyerName ?? "").trim().split(/\s+/)[0] || "there";
  const title = `<strong>${esc(input.title)}</strong>`;
  const opening = input.free ? `here's your free copy of ${title}.` : `thank you for buying ${title}.`;
  const help = input.free
    ? "If you need a fresh link, just reply to this email."
    : "If you need a fresh link, or the guide isn't for you (full refund within 7 days), just reply to this email.";
  const why = input.free
    ? "You're receiving this because you asked for this guide at"
    : "You're receiving this because you bought an e-book at";
  return {
    subject: input.free ? `Your free guide: ${input.title}` : `Your e-book: ${input.title}`,
    html: `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;background:#fff">
      <span style="display:none;max-height:0;overflow:hidden">Your download link is inside.</span>
      <div style="background:#12184a;padding:28px 32px;text-align:center;border-radius:14px 14px 0 0">
        <span style="font-size:22px;font-weight:800;color:#fff">Korea</span>
        <span style="font-size:18px;font-style:italic;color:#fff;padding:0 3px">by</span>
        <span style="font-size:22px;font-weight:800;color:#ff2e97">Local</span>
      </div>
      <div style="border:1px solid #eee;border-top:none;padding:32px;border-radius:0 0 14px 14px">
        <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#374151">
          Hi ${esc(firstName)}, ${opening}
        </p>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.65;color:#374151">
          Your copy is ready. The button below downloads the PDF.
        </p>

        <a href="${esc(input.downloadUrl)}" style="display:inline-block;background:#ff2e97;color:#fff;padding:13px 30px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14.5px">Download your e-book</a>

        <p style="margin:24px 0 0;font-size:13.5px;line-height:1.65;color:#6b7280">
          This link works ${input.maxDownloads} times, so save the PDF somewhere you'll find it.
          ${help}
        </p>

        <p style="margin-top:32px;padding-top:20px;border-top:1px solid #eee;color:#9ca3af;font-size:12px;line-height:1.6">
          ${why}
          <a href="${esc(input.siteUrl)}" style="color:#9ca3af">koreabylocal.com</a>.${input.free ? "" : " Payment was taken by PayPal."}
          Korea by Local — authentic Korean travel, from real locals.
        </p>
      </div>
    </div>`,
  };
}
