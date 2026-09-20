// deno test --allow-env supabase/functions/_shared/paypal.test.ts
import { assert, assertEquals, assertRejects } from "jsr:@std/assert@1";
import { _resetTokenCache, captureOrder, createOrder, isPayPalConfigured } from "./paypal.ts";

const KEYS = ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "PAYPAL_ENV"] as const;

function restore(key: string, value: string | undefined) {
  if (value === undefined) Deno.env.delete(key);
  else Deno.env.set(key, value);
}

function withCreds<T>(run: () => Promise<T>): Promise<T> {
  const saved = KEYS.map((k) => [k, Deno.env.get(k)] as const);
  Deno.env.set("PAYPAL_CLIENT_ID", "test-id");
  Deno.env.set("PAYPAL_CLIENT_SECRET", "test-secret");
  Deno.env.set("PAYPAL_ENV", "sandbox");
  _resetTokenCache();
  return run().finally(() => {
    for (const [k, v] of saved) restore(k, v);
    _resetTokenCache();
  });
}

const jsonRes = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const TOKEN_OK = { access_token: "tok", expires_in: 32000 };

/** Routes by URL so tests read as "token, then the call under test". */
function router(handlers: Array<{ match: RegExp; reply: () => Response }>) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fn = ((url: string | URL | Request, init?: RequestInit) => {
    const u = String(url);
    calls.push({ url: u, init: init ?? {} });
    const h = handlers.find((x) => x.match.test(u));
    if (!h) throw new Error(`unrouted: ${u}`);
    return Promise.resolve(h.reply());
  }) as unknown as typeof fetch;
  return { fn, calls };
}

Deno.test("isPayPalConfigured() follows the secrets", async () => {
  await withCreds(async () => {
    assertEquals(isPayPalConfigured(), true);
    Deno.env.delete("PAYPAL_CLIENT_SECRET");
    assertEquals(isPayPalConfigured(), false);
  });
});

Deno.test("createOrder() returns the id and the approval link", async () => {
  await withCreds(async () => {
    const { fn, calls } = router([
      { match: /oauth2\/token/, reply: () => jsonRes(TOKEN_OK) },
      {
        match: /v2\/checkout\/orders$/,
        reply: () => jsonRes({ id: "ORDER1", links: [{ rel: "self", href: "x" }, { rel: "payer-action", href: "https://paypal/approve" }] }),
      },
    ]);

    const order = await createOrder({
      amount: "1.00", currency: "USD", description: "Ask a Local question 42",
      referenceId: "42", returnUrl: "https://site/success", cancelUrl: "https://site/cancel",
    }, { fetch: fn });

    assertEquals(order, { id: "ORDER1", approveUrl: "https://paypal/approve" });
    assert(calls[0].url.includes("sandbox"), "PAYPAL_ENV=sandbox must pick the sandbox host");

    const sent = JSON.parse(calls[1].init.body as string);
    assertEquals(sent.intent, "CAPTURE");
    assertEquals(sent.purchase_units[0].reference_id, "42");
    assertEquals(sent.purchase_units[0].amount, { currency_code: "USD", value: "1.00" });
    assertEquals(sent.payment_source.paypal.experience_context.return_url, "https://site/success");
  });
});

Deno.test("createOrder() accepts the older 'approve' link name", async () => {
  await withCreds(async () => {
    const { fn } = router([
      { match: /oauth2\/token/, reply: () => jsonRes(TOKEN_OK) },
      { match: /orders$/, reply: () => jsonRes({ id: "O", links: [{ rel: "approve", href: "https://p/a" }] }) },
    ]);
    const order = await createOrder(
      { amount: "1.00", currency: "USD", description: "d", referenceId: "1", returnUrl: "r", cancelUrl: "c" },
      { fetch: fn },
    );
    assertEquals(order.approveUrl, "https://p/a");
  });
});

Deno.test("createOrder() strips characters PayPal rejects and caps the description", async () => {
  await withCreds(async () => {
    const { fn, calls } = router([
      { match: /oauth2\/token/, reply: () => jsonRes(TOKEN_OK) },
      { match: /orders$/, reply: () => jsonRes({ id: "O", links: [{ rel: "approve", href: "h" }] }) },
    ]);
    await createOrder(
      { amount: "1.00", currency: "USD", description: `a|b&c<d>"e'f${"x".repeat(200)}`, referenceId: "1", returnUrl: "r", cancelUrl: "c" },
      { fetch: fn },
    );
    const desc = JSON.parse(calls[1].init.body as string).purchase_units[0].description;
    assertEquals(desc.length, 127);
    for (const ch of ['|', '&', '<', '>', '"', "'"]) assert(!desc.includes(ch), `${ch} should be stripped`);
  });
});

Deno.test("createOrder() fails loudly when PayPal rejects the request", async () => {
  await withCreds(async () => {
    const { fn } = router([
      { match: /oauth2\/token/, reply: () => jsonRes(TOKEN_OK) },
      { match: /orders$/, reply: () => jsonRes({ name: "UNPROCESSABLE_ENTITY" }, 422) },
    ]);
    await assertRejects(
      () => createOrder({ amount: "1.00", currency: "USD", description: "d", referenceId: "1", returnUrl: "r", cancelUrl: "c" }, { fetch: fn }),
      Error,
      "paypal_create_failed",
    );
  });
});

Deno.test("createOrder() fails when there is no approval link to send the buyer to", async () => {
  await withCreds(async () => {
    const { fn } = router([
      { match: /oauth2\/token/, reply: () => jsonRes(TOKEN_OK) },
      { match: /orders$/, reply: () => jsonRes({ id: "O", links: [{ rel: "self", href: "h" }] }) },
    ]);
    await assertRejects(
      () => createOrder({ amount: "1.00", currency: "USD", description: "d", referenceId: "1", returnUrl: "r", cancelUrl: "c" }, { fetch: fn }),
      Error,
      "paypal_no_approve_url",
    );
  });
});

Deno.test("createOrder() refuses to run without credentials", async () => {
  const saved = Deno.env.get("PAYPAL_CLIENT_ID");
  Deno.env.delete("PAYPAL_CLIENT_ID");
  _resetTokenCache();
  try {
    await assertRejects(
      () => createOrder({ amount: "1.00", currency: "USD", description: "d", referenceId: "1", returnUrl: "r", cancelUrl: "c" }, { fetch: (() => { throw new Error("must not be called"); }) as unknown as typeof fetch }),
      Error,
      "paypal_not_configured",
    );
  } finally {
    restore("PAYPAL_CLIENT_ID", saved);
    _resetTokenCache();
  }
});

Deno.test("captureOrder() reads a completed capture", async () => {
  await withCreds(async () => {
    const { fn } = router([
      { match: /oauth2\/token/, reply: () => jsonRes(TOKEN_OK) },
      {
        match: /capture$/,
        reply: () => jsonRes({
          status: "COMPLETED",
          payer: { email_address: "buyer@example.com" },
          purchase_units: [{
            reference_id: "42",
            payments: { captures: [{ id: "CAP1", amount: { value: "1.00", currency_code: "USD" } }] },
          }],
        }),
      },
    ]);

    const res = await captureOrder("ORDER1", { fetch: fn });
    assertEquals(res, {
      ok: true, status: "COMPLETED", referenceId: "42",
      amount: "1.00", currency: "USD", captureId: "CAP1", payerEmail: "buyer@example.com",
    });
  });
});

Deno.test("captureOrder() treats an already-captured order as success", async () => {
  await withCreds(async () => {
    const { fn, calls } = router([
      { match: /oauth2\/token/, reply: () => jsonRes(TOKEN_OK) },
      { match: /capture$/, reply: () => jsonRes({ details: [{ issue: "ORDER_ALREADY_CAPTURED" }] }, 422) },
      {
        match: /v2\/checkout\/orders\/[^/]+$/,
        reply: () => jsonRes({
          status: "COMPLETED",
          purchase_units: [{ reference_id: "42", payments: { captures: [{ id: "CAP1", amount: { value: "1.00", currency_code: "USD" } }] } }],
        }),
      },
    ]);

    const res = await captureOrder("ORDER1", { fetch: fn });
    assertEquals(res.ok, true, "a buyer refreshing the return page must not see a failure");
    assertEquals(res.referenceId, "42");
    assertEquals(res.captureId, "CAP1");
    assertEquals(calls.length, 3, "token, capture attempt, then the lookup");
  });
});

Deno.test("captureOrder() reports a genuine failure as not ok", async () => {
  await withCreds(async () => {
    const { fn } = router([
      { match: /oauth2\/token/, reply: () => jsonRes(TOKEN_OK) },
      { match: /capture$/, reply: () => jsonRes({ name: "INSTRUMENT_DECLINED" }, 422) },
    ]);
    const res = await captureOrder("ORDER1", { fetch: fn });
    assertEquals(res.ok, false);
    assertEquals(res.referenceId, null);
  });
});

Deno.test("captureOrder() does not call a pending order completed", async () => {
  await withCreds(async () => {
    const { fn } = router([
      { match: /oauth2\/token/, reply: () => jsonRes(TOKEN_OK) },
      { match: /capture$/, reply: () => jsonRes({ status: "PAYER_ACTION_REQUIRED", purchase_units: [{ reference_id: "42" }] }) },
    ]);
    const res = await captureOrder("ORDER1", { fetch: fn });
    assertEquals(res.ok, false);
    assertEquals(res.status, "PAYER_ACTION_REQUIRED");
  });
});

Deno.test("captureOrder() reuses one access token across calls", async () => {
  await withCreds(async () => {
    const { fn, calls } = router([
      { match: /oauth2\/token/, reply: () => jsonRes(TOKEN_OK) },
      { match: /capture$/, reply: () => jsonRes({ status: "COMPLETED", purchase_units: [{ reference_id: "1" }] }) },
    ]);
    await captureOrder("A", { fetch: fn });
    await captureOrder("B", { fetch: fn });
    assertEquals(calls.filter((c) => c.url.includes("oauth2/token")).length, 1);
  });
});
