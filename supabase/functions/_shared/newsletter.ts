// Turns a newsletter written in the admin editor into the email each
// subscriber receives. Pure functions only — sending lives in send-newsletter.
//
// The editor produces bare HTML (<p>, <a>, <ul>…). Email clients ignore <style>
// blocks more often than not, so every tag gets its styling inline here, and
// the result sits in the same navy/pink frame as the welcome email.

const ESCAPES: Record<string, string> = {
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
};
const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ESCAPES[c]);

const TAG_STYLES: Record<string, string> = {
  p: "margin:0 0 16px;font-size:15px;line-height:1.7;color:#374151",
  h1: "margin:0 0 14px;font-size:22px;line-height:1.35;color:#12184a",
  h2: "margin:26px 0 12px;font-size:19px;line-height:1.35;color:#12184a",
  h3: "margin:22px 0 10px;font-size:16.5px;line-height:1.4;color:#12184a",
  ul: "margin:0 0 16px;padding-left:22px;color:#374151",
  ol: "margin:0 0 16px;padding-left:22px;color:#374151",
  li: "margin:0 0 6px;font-size:15px;line-height:1.65",
  a: "color:#ff2e97;font-weight:600",
  blockquote: "margin:0 0 16px;padding:4px 0 4px 14px;border-left:3px solid #ff2e97;color:#4b5563",
  img: "max-width:100%;height:auto;border-radius:10px",
  hr: "border:none;border-top:1px solid #eee;margin:24px 0",
};

/**
 * Adds the inline style for each known tag. A tag that already carries a
 * style attribute (written by hand in HTML mode) is left as the author wrote it.
 */
export function styleBody(html: string): string {
  return html.replace(/<(p|h[1-3]|ul|ol|li|a|blockquote|img|hr)(\s[^>]*)?>/gi, (tag, name: string, attrs = "") => {
    if (/\sstyle\s*=/i.test(attrs)) return tag;
    const selfClosing = attrs.trimEnd().endsWith("/");
    const rest = selfClosing ? attrs.trimEnd().slice(0, -1).trimEnd() : attrs;
    return `<${name}${rest} style="${TAG_STYLES[name.toLowerCase()]}"${selfClosing ? " /" : ""}>`;
  });
}

export interface RenderInput {
  bodyHtml: string;
  preheader?: string | null;
  /** Where the visible "Unsubscribe" link goes (the site's confirm page). */
  unsubscribeUrl: string;
  siteUrl: string;
  /** Optional sender postal address — CAN-SPAM wants one on commercial mail. */
  postalAddress?: string | null;
}

export function renderNewsletter(input: RenderInput): string {
  const pre = input.preheader?.trim();
  const address = input.postalAddress?.trim();
  return `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:600px;margin:0 auto;background:#fff">
      ${pre ? `<span style="display:none;max-height:0;overflow:hidden">${esc(pre)}</span>` : ""}
      <div style="background:#12184a;padding:28px 32px;text-align:center;border-radius:14px 14px 0 0">
        <a href="${esc(input.siteUrl)}" style="text-decoration:none">
          <span style="font-size:22px;font-weight:800;color:#fff">Korea</span>
          <span style="font-size:18px;font-style:italic;color:#fff;padding:0 3px">by</span>
          <span style="font-size:22px;font-weight:800;color:#ff2e97">Local</span>
        </a>
      </div>
      <div style="border:1px solid #eee;border-top:none;padding:32px;border-radius:0 0 14px 14px">
        ${styleBody(input.bodyHtml)}
        <p style="margin-top:32px;padding-top:20px;border-top:1px solid #eee;color:#9ca3af;font-size:12px;line-height:1.6">
          You're receiving this because you subscribed at
          <a href="${esc(input.siteUrl)}" style="color:#9ca3af">koreabylocal.com</a>.
          <a href="${esc(input.unsubscribeUrl)}" style="color:#6b7280;font-weight:600">Unsubscribe</a>
          ${address ? `<br />Korea by Local · ${esc(address)}` : ""}
        </p>
      </div>
    </div>
  `;
}

/**
 * RFC 8058 one-click unsubscribe. Gmail and Yahoo show their own "Unsubscribe"
 * button from these and POST to the URL directly — which is why that URL is the
 * edge function, not the site page.
 */
export function unsubscribeHeaders(oneClickUrl: string, mailto?: string | null): Record<string, string> {
  const targets = [`<${oneClickUrl}>`];
  if (mailto) targets.push(`<mailto:${mailto}?subject=unsubscribe>`);
  return {
    "List-Unsubscribe": targets.join(", "),
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

/** How many more can go out now without passing the rolling 24h cap. */
export function remainingToday(sentLast24h: number, dailyLimit: number): number {
  return Math.max(0, dailyLimit - sentLast24h);
}
