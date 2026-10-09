// A paid event ticket's PayPal order, shared by create-event-checkout (which
// opens it) and capture-event-payment (which takes the money and records the
// ticket). Self-contained, separate from the e-book's equivalent helpers —
// events and e-books are unrelated products and shouldn't share a reference
// prefix or email template.

const PREFIX = "event-";

export const eventReference = (eventId: number): string => `${PREFIX}${eventId}`;

export function parseEventReference(ref: string | null | undefined): number | null {
  const m = /^event-(\d+)$/.exec(ref ?? "");
  const id = m ? Number(m[1]) : 0;
  return id > 0 ? id : null;
}

/** USD price as PayPal wants it: a string with exactly two decimals. */
export const priceString = (priceUsd: number | string): string => Number(priceUsd).toFixed(2);

/** Whether what PayPal took covers the ticket's price. */
export function coversPrice(paid: { amount: string | null; currency: string | null }, priceUsd: number | string): boolean {
  if (paid.currency !== "USD" || paid.amount == null) return false;
  return Number(paid.amount) + 1e-9 >= Number(priceUsd);
}

// Avoids 0/O and 1/I — meant to be read aloud or typed at the door.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateConfirmationCode(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export interface TicketEmailInput {
  eventTitle: string;
  buyerName: string | null;
  confirmationCode: string;
  eventDate: string;
  timeLabel: string | null;
  location: string | null;
  siteUrl: string;
}

/** The confirmation email a buyer gets the moment payment goes through. */
export function buildTicketEmail(input: TicketEmailInput): { subject: string; html: string } {
  const firstName = (input.buyerName ?? "").trim().split(/\s+/)[0] || "there";
  const when = [input.eventDate, input.timeLabel].filter(Boolean).join(" · ");
  return {
    subject: `Your ticket: ${input.eventTitle}`,
    html: `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;background:#fff">
      <span style="display:none;max-height:0;overflow:hidden">Your confirmation code is inside.</span>
      <div style="background:#12184a;padding:28px 32px;text-align:center;border-radius:14px 14px 0 0">
        <span style="font-size:22px;font-weight:800;color:#fff">Korea</span>
        <span style="font-size:18px;font-style:italic;color:#fff;padding:0 3px">by</span>
        <span style="font-size:22px;font-weight:800;color:#ff2e97">Local</span>
      </div>
      <div style="border:1px solid #eee;border-top:none;padding:32px;border-radius:0 0 14px 14px">
        <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#374151">
          Hi ${esc(firstName)}, you're confirmed for <strong>${esc(input.eventTitle)}</strong>.
        </p>
        ${when ? `<p style="margin:0 0 6px;font-size:14px;color:#374151"><strong>When:</strong> ${esc(when)}</p>` : ""}
        ${input.location ? `<p style="margin:0 0 20px;font-size:14px;color:#374151"><strong>Where:</strong> ${esc(input.location)}</p>` : ""}

        <div style="margin:20px 0;padding:18px;background:#f9fafb;border-radius:10px;text-align:center">
          <div style="font-size:12px;color:#6b7280;letter-spacing:0.06em;text-transform:uppercase">Confirmation code</div>
          <div style="margin-top:6px;font-size:26px;font-weight:800;letter-spacing:0.08em;color:#12184a">${esc(input.confirmationCode)}</div>
        </div>

        <p style="margin:0 0 0;font-size:13.5px;line-height:1.65;color:#6b7280">
          Show this email or this code at check-in. If anything's unclear, just reply to this email.
        </p>

        <p style="margin-top:32px;padding-top:20px;border-top:1px solid #eee;color:#9ca3af;font-size:12px;line-height:1.6">
          You're receiving this because you registered for an event at
          <a href="${esc(input.siteUrl)}" style="color:#9ca3af">koreabylocal.com</a>. Payment was taken by PayPal.
          Korea by Local — authentic Korean travel, from real locals.
        </p>
      </div>
    </div>`,
  };
}
