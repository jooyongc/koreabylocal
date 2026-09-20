// Issues the GA4 refresh token that supabase/functions/ga4-report uses, and
// finds the numeric property id while it is there.
//
// Reuses the Desktop OAuth client the site's Gmail sending already has, so
// there is no service account to create and nobody to add to the property:
// the token carries the access of whoever signs in, and they can already see
// the property.
//
//   GMAIL_CLIENT_ID=... GMAIL_CLIENT_SECRET=... \
//     node scripts/get-ga4-token.mjs --write ../.env.local
//
// Open the printed URL, sign in as the account that can see the GA4 property,
// and allow. The token is written to the --write env file and never printed.
//
// If Google answers "Google Analytics Data API has not been used in project
// …", open the link in that message once to enable the API, then re-run.

import { createServer } from "node:http";
import { createHash, randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const { GMAIL_CLIENT_ID: clientId, GMAIL_CLIENT_SECRET: clientSecret } = process.env;
const writeIdx = process.argv.indexOf("--write");
const envFile = writeIdx > -1 ? process.argv[writeIdx + 1] : null;
const wantMeasurementId = process.argv.find((a) => a.startsWith("G-")) ?? "G-D3M000PW4J";

if (!clientId || !clientSecret || !envFile) {
  console.error("Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET, and pass --write <env file>.");
  process.exit(1);
}

// readonly is enough: this only ever reads reports.
const SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "openid",
  "email",
];

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

/**
 * Walks the account summaries looking for the property that owns the site's
 * measurement id, so nobody has to copy a number out of the GA4 console — the
 * usual mistake is pasting the G-… id, which the Data API will not take.
 */
async function findProperty(accessToken) {
  const auth = { Authorization: `Bearer ${accessToken}` };

  const res = await fetch(
    "https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200",
    { headers: auth },
  );
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.error?.message ?? `account summaries failed (${res.status})`);
  }

  const properties = (body.accountSummaries ?? []).flatMap((a) =>
    (a.propertySummaries ?? []).map((p) => ({
      account: a.displayName,
      name: p.property, // "properties/123456789"
      display: p.displayName,
    })),
  );
  if (properties.length === 0) throw new Error("this Google account cannot see any GA4 property");

  // Match on the measurement id by checking each property's data streams.
  for (const prop of properties) {
    const streams = await fetch(
      `https://analyticsadmin.googleapis.com/v1beta/${prop.name}/dataStreams?pageSize=50`,
      { headers: auth },
    ).then((r) => (r.ok ? r.json() : { dataStreams: [] }));

    const hit = (streams.dataStreams ?? []).find(
      (s) => s.webStreamData?.measurementId === wantMeasurementId,
    );
    if (hit) return { ...prop, id: prop.name.split("/")[1], matched: true };
  }

  return { ...properties[0], id: properties[0].name.split("/")[1], matched: false, all: properties };
}

let redirectUri;

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

  const claims = JSON.parse(Buffer.from(tokens.id_token.split(".")[1], "base64url").toString());

  let property;
  try {
    property = await findProperty(tokens.access_token);
  } catch (err) {
    return done(500, `Signed in as ${claims.email}, but GA4 lookup failed: ${err.message}`);
  }

  upsertEnv(envFile, "GA4_REFRESH_TOKEN", tokens.refresh_token);
  upsertEnv(envFile, "GA4_PROPERTY_ID", property.id);

  const note = property.matched
    ? `matched ${wantMeasurementId}`
    : `NO property carries ${wantMeasurementId} — using the first one visible, check this is right:\n` +
      property.all.map((p) => `  ${p.name.split("/")[1]}  ${p.account} / ${p.display}`).join("\n");

  done(
    200,
    `Signed in as ${claims.email}.\n` +
      `GA4 property ${property.id} (${property.account} / ${property.display}) — ${note}\n\n` +
      `Written to ${envFile}: GA4_REFRESH_TOKEN, GA4_PROPERTY_ID.\n` +
      `The token was not printed. Now put both into Supabase secrets.`,
  );
});

server.listen(0, "127.0.0.1", () => {
  redirectUri = `http://127.0.0.1:${server.address().port}/callback`;

  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.searchParams.set("client_id", clientId);
  auth.searchParams.set("redirect_uri", redirectUri);
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("scope", SCOPES.join(" "));
  // Google only returns a refresh token on an explicit, offline consent.
  auth.searchParams.set("access_type", "offline");
  auth.searchParams.set("prompt", "consent");
  auth.searchParams.set("code_challenge", challenge);
  auth.searchParams.set("code_challenge_method", "S256");
  auth.searchParams.set("state", state);

  console.log("\nOpen this and sign in with the account that can see the GA4 property:\n");
  console.log(auth.toString());
  console.log("\nWaiting for the redirect…\n");
});
