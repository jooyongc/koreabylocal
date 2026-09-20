// Turns a Google service-account key into an access token, signed here with
// WebCrypto.
//
// The GA4 Data API cannot be called with the measurement ID (G-…) the site
// uses, and it cannot be called from the browser at all — a service-account
// key in front-end code is a key given away. So the private key stays in
// Supabase secrets and the signing happens in the edge function.
//
// REQUIRED secret: GA4_SERVICE_ACCOUNT — the downloaded JSON, whole.

const TOKEN_URL = "https://oauth2.googleapis.com/token";

export interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id?: string;
}

export function readServiceAccount(raw: string | undefined): ServiceAccount | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ServiceAccount;
    if (!parsed.client_email || !parsed.private_key) return null;
    // Secrets set through a shell often arrive with the newlines escaped.
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    return parsed;
  } catch {
    return null;
  }
}

const b64url = (bytes: ArrayBuffer): string => {
  const arr = new Uint8Array(bytes);
  let bin = "";
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const b64urlText = (text: string) => b64url(new TextEncoder().encode(text).buffer as ArrayBuffer);

/** PEM to the DER bytes WebCrypto wants for a PKCS#8 import. */
function pemToDer(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/, "")
    .replace(/-----END [^-]+-----/, "")
    .replace(/\s+/g, "");
  const bin = atob(body);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

// Tokens last an hour; reuse one across invocations of a warm worker.
let cached: { token: string; expiresAt: number; scope: string } | null = null;

/**
 * Signs a JWT with the service account key and exchanges it for an access
 * token. Never throws a raw crypto error at the caller — a malformed key is
 * reported as such, because that is nearly always what has gone wrong.
 */
export async function getAccessToken(account: ServiceAccount, scope: string): Promise<string> {
  if (cached && cached.scope === scope && cached.expiresAt > Date.now() + 60_000) {
    return cached.token;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = b64urlText(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64urlText(JSON.stringify({
    iss: account.client_email,
    scope,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }));

  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey(
      "pkcs8",
      pemToDer(account.private_key),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"],
    );
  } catch {
    throw new Error("GA4_SERVICE_ACCOUNT private_key could not be read — paste the JSON file whole, unedited");
  }

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(`${header}.${claims}`).buffer as ArrayBuffer,
  );
  const assertion = `${header}.${claims}.${b64url(signature)}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(`Google refused the service account (${res.status}): ${data.error_description ?? data.error ?? "unknown"}`);
  }

  cached = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
    scope,
  };
  return cached.token;
}

/** Only for tests — a cached token would otherwise leak between cases. */
export function _resetTokenCache() {
  cached = null;
}
