// deno test --allow-env supabase/functions/_shared/typesafe.test.ts
//
// fetch is injected throughout, so these run offline and never spend tokens.
import { assert, assertEquals, assertAlmostEquals } from "jsr:@std/assert@1";
import {
  asChoice,
  asNoul,
  asScore,
  choice,
  chunkByTokens,
  contentWords,
  estimateTokens,
  judge,
  noul,
  score,
  topByWordOverlap,
  type Answer,
} from "./typesafe.ts";

const KEY = "test-key";

const jsonResponse = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });

const OK_BODY = {
  model: "jev-1.13.0",
  answers: { q1: { type: "noul", noul: 0.9 } },
  usage: { input_tokens: 381, output_tokens: 21 },
};

/** Replays `factories` in order, repeating the last one once exhausted. */
function fakeFetch(factories: Array<() => Response | Promise<Response>>) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fn = ((url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    const factory = factories[Math.min(calls.length - 1, factories.length - 1)];
    return Promise.resolve(factory());
  }) as unknown as typeof fetch;
  return { fn, calls };
}

function recordingSleep() {
  const waits: number[] = [];
  return { waits, sleep: (ms: number) => { waits.push(ms); return Promise.resolve(); } };
}

const Q = { q1: noul("Is this a test?") };

// ------------------------------------------------------------------ builders

Deno.test("noul() omits criteria when none is given", () => {
  assertEquals(noul("Is it urgent?"), { type: "noul", instructions: "Is it urgent?" });
});

Deno.test("noul() carries true/false criteria through", () => {
  const q = noul("Duplicate?", { true: "already covered", false: "not covered" });
  assertEquals(q.criteria, { true: "already covered", false: "not covered" });
});

Deno.test("choice() and score() keep their criteria shapes", () => {
  assertEquals(choice("Pick one", { Transport: "buses, trains", Food: null }), {
    type: "choice",
    instructions: "Pick one",
    criteria: { Transport: "buses, trains", Food: null },
  });
  assertEquals(score("Rate it", ["poor", "fine", "great"]).criteria, ["poor", "fine", "great"]);
});

// ------------------------------------------------------------ answer guards

Deno.test("answer guards accept well-formed answers", () => {
  assert(asNoul({ type: "noul", noul: 0.4 }));
  assert(asChoice({ type: "choice", choice: "Food", probabilities: { Food: 1 }, confidence: 0.9 }));
  assert(asScore({ type: "score", score: 1.6, legend: {}, probabilities: {}, confidence: 0.8 }));
});

Deno.test("answer guards reject missing, mistyped, or malformed answers", () => {
  assertEquals(asNoul(undefined), null);
  assertEquals(asNoul({ type: "choice", choice: "x", probabilities: {}, confidence: 1 } as Answer), null);
  // Right type tag, wrong payload — a truncated or garbled answer must not pass.
  assertEquals(asNoul({ type: "noul" } as unknown as Answer), null);
  assertEquals(asScore({ type: "score", score: "high" } as unknown as Answer), null);
});

// -------------------------------------------------------------- not_configured

Deno.test("judge() reports not_configured when the key is absent", async () => {
  const saved = Deno.env.get("TYPESAFE_API_KEY");
  Deno.env.delete("TYPESAFE_API_KEY");
  try {
    const { fn, calls } = fakeFetch([() => jsonResponse(OK_BODY)]);
    const res = await judge("state", Q, { fetch: fn });
    assertEquals(res.ok, false);
    assert(!res.ok && res.error === "not_configured");
    assertEquals(calls.length, 0, "must not reach the network without a key");
  } finally {
    if (saved !== undefined) Deno.env.set("TYPESAFE_API_KEY", saved);
  }
});

Deno.test("judge() rejects an empty question set before calling out", async () => {
  const { fn, calls } = fakeFetch([() => jsonResponse(OK_BODY)]);
  const res = await judge("state", {}, { apiKey: KEY, fetch: fn });
  assert(!res.ok && res.error === "invalid_request");
  assertEquals(calls.length, 0);
});

// --------------------------------------------------------------------- 200

Deno.test("judge() returns answers, usage, resolved model and elapsed ms on 200", async () => {
  const { fn, calls } = fakeFetch([() => jsonResponse(OK_BODY)]);
  const res = await judge({ a: 1 }, Q, { apiKey: KEY, fetch: fn });

  assert(res.ok);
  assertEquals(res.answers, OK_BODY.answers as Record<string, Answer>);
  assertEquals(res.usage, { input_tokens: 381, output_tokens: 21 });
  assertEquals(res.model, "jev-1.13.0", "resolved version, not the alias we sent");
  assert(res.ms >= 0);
  assertEquals(calls.length, 1);

  const { init } = calls[0];
  assertEquals(calls[0].url, "https://api.typesafe.ai/v1/systemone");
  assertEquals(init.method, "POST");
  assertEquals((init.headers as Record<string, string>).Authorization, `Bearer ${KEY}`);
  const sent = JSON.parse(init.body as string);
  assertEquals(sent.state, { a: 1 });
  assertEquals(sent.questions, Q);
});

Deno.test("judge() sends jev-latest by default and honours an explicit model", async () => {
  const savedModel = Deno.env.get("TYPESAFE_MODEL");
  Deno.env.delete("TYPESAFE_MODEL");
  try {
    const a = fakeFetch([() => jsonResponse(OK_BODY)]);
    await judge("s", Q, { apiKey: KEY, fetch: a.fn });
    assertEquals(JSON.parse(a.calls[0].init.body as string).model, "jev-latest");

    const b = fakeFetch([() => jsonResponse(OK_BODY)]);
    await judge("s", Q, { apiKey: KEY, fetch: b.fn, model: "jev-1.13.0" });
    assertEquals(JSON.parse(b.calls[0].init.body as string).model, "jev-1.13.0");
  } finally {
    if (savedModel !== undefined) Deno.env.set("TYPESAFE_MODEL", savedModel);
  }
});

Deno.test("judge() falls back to a zero usage record when the field is absent", async () => {
  const { fn } = fakeFetch([() => jsonResponse({ model: "jev-1.13.0", answers: {} })]);
  const res = await judge("s", Q, { apiKey: KEY, fetch: fn });
  assert(res.ok);
  assertEquals(res.usage, { input_tokens: 0, output_tokens: 0 });
});

// ------------------------------------------------------------- 401 and 422

Deno.test("judge() fails immediately on 401 without retrying", async () => {
  const { fn, calls } = fakeFetch([() => new Response("Missing or invalid API key", { status: 401 })]);
  const res = await judge("s", Q, { apiKey: KEY, fetch: fn, retries: 2 });
  assert(!res.ok && res.error === "unauthorized");
  assertEquals(!res.ok && res.status, 401);
  assertEquals(calls.length, 1, "a bad key will still be bad on the next attempt");
});

Deno.test("judge() fails immediately on 422 without retrying", async () => {
  const { fn, calls } = fakeFetch([() => new Response("questions.q1: invalid", { status: 422 })]);
  const res = await judge("s", Q, { apiKey: KEY, fetch: fn, retries: 2 });
  assert(!res.ok && res.error === "invalid_request");
  assertEquals(calls.length, 1);
});

// ------------------------------------------------------------- 429 and 529

Deno.test("judge() retries 429 with exponential backoff and succeeds", async () => {
  const { waits, sleep } = recordingSleep();
  const { fn, calls } = fakeFetch([
    () => new Response("rate limited", { status: 429 }),
    () => new Response("rate limited", { status: 429 }),
    () => jsonResponse(OK_BODY),
  ]);
  const res = await judge("s", Q, { apiKey: KEY, fetch: fn, sleep, retries: 2 });

  assert(res.ok);
  assertEquals(calls.length, 3);
  assertEquals(waits.length, 2);
  assert(waits[0] >= 500 && waits[0] < 750, `first backoff ~500ms, got ${waits[0]}`);
  assert(waits[1] >= 1000 && waits[1] < 1250, `second backoff ~1000ms, got ${waits[1]}`);
});

Deno.test("judge() gives up with rate_limited once retries run out", async () => {
  const { sleep, waits } = recordingSleep();
  const { fn, calls } = fakeFetch([() => new Response("slow down", { status: 429 })]);
  const res = await judge("s", Q, { apiKey: KEY, fetch: fn, sleep, retries: 2 });

  assert(!res.ok && res.error === "rate_limited");
  assertEquals(calls.length, 3, "initial attempt plus two retries");
  assertEquals(waits.length, 2);
});

Deno.test("judge() treats 529 as overloaded and retries it", async () => {
  const { sleep } = recordingSleep();
  const { fn, calls } = fakeFetch([
    () => new Response("overloaded", { status: 529 }),
    () => jsonResponse(OK_BODY),
  ]);
  const res = await judge("s", Q, { apiKey: KEY, fetch: fn, sleep });
  assert(res.ok);
  assertEquals(calls.length, 2);

  const always = fakeFetch([() => new Response("overloaded", { status: 529 })]);
  const gaveUp = await judge("s", Q, { apiKey: KEY, fetch: always.fn, sleep, retries: 1 });
  assert(!gaveUp.ok && gaveUp.error === "overloaded");
});

Deno.test("judge() prefers the Retry-After header over its own backoff", async () => {
  const { waits, sleep } = recordingSleep();
  const { fn } = fakeFetch([
    () => new Response("slow down", { status: 429, headers: { "Retry-After": "3" } }),
    () => jsonResponse(OK_BODY),
  ]);
  await judge("s", Q, { apiKey: KEY, fetch: fn, sleep });
  assertEquals(waits, [3000]);
});

Deno.test("judge() caps an absurd Retry-After at 10s", async () => {
  const { waits, sleep } = recordingSleep();
  const { fn } = fakeFetch([
    () => new Response("later", { status: 429, headers: { "Retry-After": "600" } }),
    () => jsonResponse(OK_BODY),
  ]);
  await judge("s", Q, { apiKey: KEY, fetch: fn, sleep });
  assertEquals(waits, [10_000]);
});

// ----------------------------------------------- timeout, transport, garbage

Deno.test("judge() reports a timeout and does not retry it", async () => {
  let aborts = 0;
  const calls: number[] = [];
  const hanging = ((_url: string, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      calls.push(1);
      init!.signal!.addEventListener("abort", () => {
        aborts++;
        const err = new Error("The signal has been aborted");
        err.name = "AbortError";
        reject(err);
      });
    })) as unknown as typeof fetch;

  const started = Date.now();
  const res = await judge("s", Q, { apiKey: KEY, fetch: hanging, timeoutMs: 50, retries: 2 });

  assert(!res.ok && res.error === "timeout");
  assert(res.ok === false && res.message.includes("50ms"));
  assertEquals(calls.length, 1, "retrying a timeout would double the caller's latency budget");
  assertEquals(aborts, 1);
  assert(Date.now() - started < 2000);
});

Deno.test("judge() reports transport failures as network_error", async () => {
  const failing = (() => Promise.reject(new TypeError("connection refused"))) as unknown as typeof fetch;
  const res = await judge("s", Q, { apiKey: KEY, fetch: failing, retries: 2 });
  assert(!res.ok && res.error === "network_error");
  assert(res.ok === false && res.message.includes("connection refused"));
});

Deno.test("judge() reports a non-JSON 200 as bad_response", async () => {
  const { fn } = fakeFetch([() => new Response("<html>gateway</html>", { status: 200 })]);
  const res = await judge("s", Q, { apiKey: KEY, fetch: fn });
  assert(!res.ok && res.error === "bad_response");
});

Deno.test("judge() reports a 200 without answers as bad_response", async () => {
  const { fn } = fakeFetch([() => jsonResponse({ model: "jev-1.13.0" })]);
  const res = await judge("s", Q, { apiKey: KEY, fetch: fn });
  assert(!res.ok && res.error === "bad_response");
});

Deno.test("judge() reports unexpected statuses as http_error without retrying", async () => {
  const { fn, calls } = fakeFetch([() => new Response("bad gateway", { status: 502 })]);
  const res = await judge("s", Q, { apiKey: KEY, fetch: fn, retries: 2 });
  assert(!res.ok && res.error === "http_error");
  assertEquals(!res.ok && res.status, 502);
  assertEquals(calls.length, 1);
});

// -------------------------------------------------------- budgeting helpers

Deno.test("estimateTokens() approximates ~4 characters per token", () => {
  assertEquals(estimateTokens(""), 0);
  assertEquals(estimateTokens("abcd"), 1);
  assertEquals(estimateTokens("abcde"), 2);
  // Objects are measured as the JSON actually sent, punctuation included.
  assertAlmostEquals(estimateTokens({ a: "bb" }), Math.ceil('{"a":"bb"}'.length / 4));
});

Deno.test("chunkByTokens() splits a list into groups under the budget", () => {
  const items = ["a", "b", "c", "d"];
  const groups = chunkByTokens(items, 2, () => 1);
  assertEquals(groups, [["a", "b"], ["c", "d"]]);
});

Deno.test("chunkByTokens() keeps an oversized item instead of dropping it", () => {
  const groups = chunkByTokens(["small", "enormous", "small"], 10, (s) => (s === "enormous" ? 99 : 5));
  assertEquals(groups, [["small"], ["enormous"], ["small"]]);
  assertEquals(groups.flat().length, 3, "nothing is silently discarded");
});

Deno.test("chunkByTokens() returns no groups for an empty list", () => {
  assertEquals(chunkByTokens([], 100), []);
});

Deno.test("chunkByTokens() measures real titles against a state budget", () => {
  const titles = Array.from({ length: 200 }, (_, i) => `How to take the KTX from Seoul to Busan ${i}`);
  const groups = chunkByTokens(titles, 200);
  assert(groups.length > 1, "200 titles should not fit one 200-token batch");
  assertEquals(groups.flat().length, 200);
  for (const g of groups) {
    assert(g.reduce((n, t) => n + estimateTokens(t), 0) <= 200 || g.length === 1);
  }
});

// ------------------------------------------------------------ word overlap

Deno.test("contentWords() drops short words, stopwords and punctuation", () => {
  const w = contentWords("How to Book KTX Trains in Korea: The Ultimate Guide!");
  assert(w.has("book"));
  assert(w.has("ktx"));
  assert(w.has("trains"));
  assert(!w.has("the"), "stopword");
  assert(!w.has("to"), "too short");
  assert(!w.has("korea"), "every title on this site has it");
  assert(!w.has("guide"), "ditto");
});

Deno.test("contentWords() de-duplicates repeats", () => {
  assertEquals(contentWords("bus bus BUS buses").size, 2);
});

Deno.test("topByWordOverlap() returns everything when under the limit", () => {
  const items = ["one", "two"];
  assertEquals(topByWordOverlap("anything", items, 10, (s) => s), items);
});

Deno.test("topByWordOverlap() ranks by shared content words", () => {
  const posts = [
    "Korean Kimchi and where to buy",
    "How to Book KTX Trains in Korea: The Ultimate Guide to the KORAIL Pass",
    "Must-Visit Cafes in Seoul, A Local's Guide by a Korean",
    "Cash Free Bus and T-money Card",
  ];
  const top = topByWordOverlap("Booking KTX tickets with the KORAIL Pass", posts, 2, (s) => s);
  assertEquals(top[0], "How to Book KTX Trains in Korea: The Ultimate Guide to the KORAIL Pass");
  assertEquals(top.length, 2);
});

Deno.test("topByWordOverlap() breaks ties on the caller's order", () => {
  // Nothing shares a word, so the newest-first order the caller passed must hold.
  const posts = ["newest", "middle", "oldest"];
  assertEquals(topByWordOverlap("zzz qqq", posts, 2, (s) => s), ["newest", "middle"]);
});

Deno.test("topByWordOverlap() reads the text through the accessor", () => {
  const posts = [
    { slug: "a", title: "Renting a car on Jeju" },
    { slug: "b", title: "Where to stay in Busan" },
  ];
  const top = topByWordOverlap("Busan neighborhood guide", posts, 1, (p) => p.title);
  assertEquals(top[0].slug, "b");
});
