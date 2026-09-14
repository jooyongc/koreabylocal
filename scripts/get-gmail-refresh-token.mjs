// Issues the Gmail API refresh token used by supabase/functions/_shared/gmail.ts.
//
// Needs a Google Cloud OAuth client of type "Desktop app" (Gmail API enabled,
// consent screen published "In production" — tokens from a "Testing" app die
// after 7 days).
//
//   GMAIL_CLIENT_ID=... GMAIL_CLIENT_SECRET=... GMAIL_SENDER=koreabylocal@gmail.com \
//     node scripts/get-gmail-refresh-token.mjs --write ../.env.local
//
// Open the printed URL, sign in as GMAIL_SENDER and allow. The token is written
// to the --write env file (GMAIL_REFRESH_TOKEN=...) and never printed. Then:
//   supabase secrets set GMAIL_REFRESH_TOKEN=... (plus the client id/secret/sender)
import { createServer } from "node:http";
import { createHash, randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const { GMAIL_CLIENT_ID: clientId, GMAIL_CLIENT_SECRET: clientSecret, GMAIL_SENDER: sender } = process.env;
const writeIdx = process.argv.indexOf("--write");
const envFile = writeIdx > -1 ? process.argv[writeIdx + 1] : null;

if (!clientId || !clientSecret || !sender || !envFile) {
  console.error("Set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_SENDER and pass --write <env file>.");
  process.exit(1);
}

const SCOPES = ["https://www.googleapis.com/auth/gmail.send", "openid", "email"];
const b64url = (buf) => buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const verifier = b64url(randomBytes(32));
const challenge = b64url(createHash("sha256").update(verifier).digest());
const state = b64url(randomBytes(16));

function upsertEnv(file, key, value) {
  const text = existsSync(file) ? readFileSync(file, "utf8") : "";
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  writeFileSync(file, re.test(text) ? text.replace(re, line) : `${text.replace(/\n?$/, "\n")}${line}\n`);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  if (url.pathname !== "/callback") return res.writeHead(404).end();

  const done = (status, msg) => {
    res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" }).end(msg);
    console.log(msg);
    server.close();
    process.exitCode = status === 200 ? 0 : 1;
  };

  if (url.searchParams.get("state") !== state) return done(400, "State mismatch — aborting.");
  const code = url.searchParams.get("code");
  if (!code) return done(400, `Authorization failed: ${url.searchParams.get("error")}`);

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
  });
  const tokens = await tokenRes.json();
  if (!tokenRes.ok || !tokens.refresh_token) {
    return done(500, `Token exchange failed: ${tokens.error ?? "no refresh_token returned"} ${tokens.error_description ?? ""}`);
  }

  // The id_token came straight from Google over TLS, so reading its claims is enough here.
  const claims = JSON.parse(Buffer.from(tokens.id_token.split(".")[1], "base64url").toString());
  if (claims.email?.toLowerCase() !== sender.toLowerCase()) {
    return done(400, `Signed in as ${claims.email}, expected ${sender}. Nothing written — try again with the right account.`);
  }

  upsertEnv(envFile, "GMAIL_REFRESH_TOKEN", tokens.refresh_token);
  done(200, `OK: refresh token for ${claims.email} written to ${envFile}. You can close this tab.`);
});

let redirectUri;
server.listen(0, "127.0.0.1", () => {
  redirectUri = `http://127.0.0.1:${server.address().port}/callback`;
  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    login_hint: sender,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  }).toString();
  console.log(`Open this URL and sign in as ${sender}:\n${auth}`);
});
