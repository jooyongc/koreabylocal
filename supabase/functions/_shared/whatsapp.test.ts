// deno test --allow-env supabase/functions/_shared/whatsapp.test.ts
import { assert, assertEquals } from "jsr:@std/assert@1";
import { isWhatsAppConfigured, notifyTeam, recipients } from "./whatsapp.ts";

const KEYS = [
  "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_ACCESS_TOKEN", "WHATSAPP_TO",
  "WHATSAPP_TEMPLATE_NAME", "WHATSAPP_TEMPLATE_LANG", "WHATSAPP_API_VERSION",
] as const;

function restore(key: string, value: string | undefined) {
  if (value === undefined) Deno.env.delete(key);
  else Deno.env.set(key, value);
}

/** Runs with exactly the given WhatsApp env, then puts the old one back. */
function withEnv<T>(env: Record<string, string | undefined>, run: () => Promise<T>): Promise<T> {
  const saved = KEYS.map((k) => [k, Deno.env.get(k)] as const);
  for (const k of KEYS) Deno.env.delete(k);
  for (const [k, v] of Object.entries(env)) if (v !== undefined) Deno.env.set(k, v);
  return run().finally(() => { for (const [k, v] of saved) restore(k, v); });
}

const BASE = {
  WHATSAPP_PHONE_NUMBER_ID: "111222333",
  WHATSAPP_ACCESS_TOKEN: "tok",
  WHATSAPP_TO: "821012345678,821098765432",
};

function recorder(reply: (body: Record<string, unknown>) => Response) {
  const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
  const fn = ((url: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse((init?.body as string) ?? "{}");
    calls.push({ url: String(url), body });
    return Promise.resolve(reply(body));
  }) as unknown as typeof fetch;
  return { fn, calls };
}

const okRes = () => new Response(JSON.stringify({ messages: [{ id: "wamid.x" }] }), { status: 200 });

Deno.test("recipients() strips formatting and drops junk", async () => {
  await withEnv({ WHATSAPP_TO: "+82 10-1234-5678, 821098765432 , , 12" }, async () => {
    assertEquals(recipients(), ["821012345678", "821098765432"]);
  });
});

Deno.test("isWhatsAppConfigured() needs an id, a token and at least one number", async () => {
  await withEnv(BASE, async () => assertEquals(isWhatsAppConfigured(), true));
  await withEnv({ ...BASE, WHATSAPP_TO: undefined }, async () => assertEquals(isWhatsAppConfigured(), false));
  await withEnv({ ...BASE, WHATSAPP_ACCESS_TOKEN: undefined }, async () => assertEquals(isWhatsAppConfigured(), false));
});

Deno.test("notifyTeam() messages both numbers", async () => {
  await withEnv(BASE, async () => {
    const { fn, calls } = recorder(okRes);
    const results = await notifyTeam("hello", { fetch: fn });

    assertEquals(calls.length, 2, "both phones should buzz");
    assertEquals(calls.map((c) => c.body.to), ["821012345678", "821098765432"]);
    assertEquals(results.every((r) => r.ok), true);
    assert(calls[0].url.includes("/111222333/messages"));
  });
});

Deno.test("notifyTeam() sends both at once rather than one after the other", async () => {
  await withEnv(BASE, async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const fn = (() => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      return new Promise<Response>((resolve) =>
        setTimeout(() => { inFlight--; resolve(okRes()); }, 20)
      );
    }) as unknown as typeof fetch;

    await notifyTeam("hello", { fetch: fn });
    assertEquals(maxInFlight, 2, "the two sends must overlap");
  });
});

Deno.test("notifyTeam() keeps going when one number fails", async () => {
  await withEnv(BASE, async () => {
    const { fn } = recorder((body) =>
      body.to === "821012345678"
        ? new Response(JSON.stringify({ error: { message: "recipient not on WhatsApp" } }), { status: 400 })
        : okRes()
    );
    const results = await notifyTeam("hello", { fetch: fn });

    assertEquals(results.length, 2);
    assertEquals(results[0].ok, false);
    assertEquals(results[1].ok, true, "the second number must still be tried");
  });
});

Deno.test("notifyTeam() reports a timeout without throwing", async () => {
  await withEnv({ ...BASE, WHATSAPP_TO: "821012345678" }, async () => {
    const hanging = ((_u: string, init?: RequestInit) =>
      new Promise<Response>((_res, rej) => {
        init!.signal!.addEventListener("abort", () => {
          const e = new Error("aborted"); e.name = "AbortError"; rej(e);
        });
      })) as unknown as typeof fetch;

    const results = await notifyTeam("hello", { fetch: hanging, timeoutMs: 30 });
    assertEquals(results[0].ok, false);
    assert(results[0].error?.includes("30ms"));
  });
});

Deno.test("notifyTeam() does nothing, quietly, when unconfigured", async () => {
  await withEnv({}, async () => {
    const { fn, calls } = recorder(okRes);
    assertEquals(await notifyTeam("hello", { fetch: fn }), []);
    assertEquals(calls.length, 0);
  });
});

Deno.test("notifyTeam() sends plain text with previews off by default", async () => {
  await withEnv(BASE, async () => {
    const { fn, calls } = recorder(okRes);
    await notifyTeam("a question", { fetch: fn });
    assertEquals(calls[0].body.type, "text");
    assertEquals(calls[0].body.text, { preview_url: false, body: "a question" });
  });
});

Deno.test("notifyTeam() switches to a template when one is configured", async () => {
  await withEnv({ ...BASE, WHATSAPP_TEMPLATE_NAME: "new_inquiry", WHATSAPP_TEMPLATE_LANG: "ko" }, async () => {
    const { fn, calls } = recorder(okRes);
    await notifyTeam("ignored when templated", { fetch: fn, templateParams: ["7", "Transport", "q", "url"] });

    const tpl = calls[0].body.template as {
      name: string;
      language: { code: string };
      components: Array<{ parameters: Array<{ text: string }> }>;
    };
    assertEquals(calls[0].body.type, "template");
    assertEquals(tpl.name, "new_inquiry");
    assertEquals(tpl.language.code, "ko");
    assertEquals(tpl.components[0].parameters.map((p) => p.text), ["7", "Transport", "q", "url"]);
  });
});

Deno.test("notifyTeam() honours the API version override", async () => {
  await withEnv({ ...BASE, WHATSAPP_API_VERSION: "v22.0" }, async () => {
    const { fn, calls } = recorder(okRes);
    await notifyTeam("hi", { fetch: fn });
    assert(calls[0].url.includes("/v22.0/"), calls[0].url);
  });
});
