// Sends email through the Gmail API as the site's Google account, using a
// long-lived OAuth refresh token. HTTPS only — Supabase Edge Functions block
// outbound SMTP on ports 25/587, so Gmail SMTP isn't an option here.
//
// REQUIRED secrets: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN,
// GMAIL_SENDER (the account the token was issued for, e.g.
// koreabylocal@gmail.com — Gmail rewrites any other From address to it).
// Optional: GMAIL_SENDER_NAME (default "Korea by Local").
// Re-issue the refresh token with scripts/get-gmail-refresh-token.mjs.

const CLIENT_ID = Deno.env.get("GMAIL_CLIENT_ID");
const CLIENT_SECRET = Deno.env.get("GMAIL_CLIENT_SECRET");
const REFRESH_TOKEN = Deno.env.get("GMAIL_REFRESH_TOKEN");
export const GMAIL_SENDER = Deno.env.get("GMAIL_SENDER") ?? "";
const SENDER_NAME = Deno.env.get("GMAIL_SENDER_NAME") || "Korea by Local";

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export type SendResult = { ok: true; id: string } | { ok: false; status: number; error: string };

export function isMailConfigured(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN && GMAIL_SENDER);
}

// Access tokens last ~1h; reuse one across invocations of a warm worker.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
      refresh_token: REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`Google token refresh failed (${res.status}): ${data.error ?? "unknown"} ${data.error_description ?? ""}`);
  }
  cachedToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 };
  return cachedToken.value;
}

function base64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

const utf8 = (s: string) => new TextEncoder().encode(s);

// Header values must not carry line breaks (header injection).
const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

// RFC 2047 encoded-word so non-ASCII subjects/names (emoji, Korean) survive.
const encodeHeader = (s: string) => `=?UTF-8?B?${base64(utf8(oneLine(s)))}?=`;

function buildRawMessage(msg: MailMessage): string {
  const headers = [
    `From: ${encodeHeader(SENDER_NAME)} <${GMAIL_SENDER}>`,
    `To: ${oneLine(msg.to)}`,
    ...(msg.replyTo ? [`Reply-To: ${oneLine(msg.replyTo)}`] : []),
    `Subject: ${encodeHeader(msg.subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
  ];
  const body = base64(utf8(msg.html)).replace(/.{76}/g, "$&\r\n");
  const mime = `${headers.join("\r\n")}\r\n\r\n${body}`;
  return base64(utf8(mime)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function sendMail(msg: MailMessage): Promise<SendResult> {
  if (!isMailConfigured()) return { ok: false, status: 503, error: "email_not_configured" };

  try {
    const accessToken = await getAccessToken();
    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ raw: buildRawMessage(msg) }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("gmail: send failed:", res.status, JSON.stringify(data.error ?? data));
      return { ok: false, status: res.status, error: data.error?.message ?? "send_failed" };
    }
    return { ok: true, id: data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("gmail:", message);
    return { ok: false, status: 500, error: message };
  }
}
