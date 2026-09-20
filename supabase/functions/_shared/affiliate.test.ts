// deno test --allow-env supabase/functions/_shared/affiliate.test.ts
import { assert, assertEquals } from "jsr:@std/assert@1";
import { applyAffiliates, activePrograms, hasAffiliates, stripAffiliates, type Program } from "./affiliate.ts";
import type { Answer, JudgeResult, Question } from "./typesafe.ts";

const KEYS = [
  "AFFILIATE_KLOOK_AID", "AFFILIATE_AGODA_CID",
  "AFFILIATE_OLIVEYOUNG_URL", "AFFILIATE_OLIVEYOUNG_CODE", "AFFILIATE_THRESHOLD",
] as const;

function withEnv<T>(env: Record<string, string>, run: () => T | Promise<T>): Promise<T> {
  const saved = KEYS.map((k) => [k, Deno.env.get(k)] as const);
  for (const k of KEYS) Deno.env.delete(k);
  for (const [k, v] of Object.entries(env)) Deno.env.set(k, v);
  return Promise.resolve(run()).finally(() => {
    for (const [k, v] of saved) {
      if (v === undefined) Deno.env.delete(k);
      else Deno.env.set(k, v);
    }
  });
}

const PROGRAMS: Program[] = [
  { id: "klook", label: "Klook", fits: "booking a tour", href: "https://klook?aid=1", cta: "Book on Klook" },
  { id: "oliveyoung", label: "Olive Young", fits: "buying K-beauty", href: "https://oy", cta: "Shop K-beauty", note: "Use code <strong>X</strong>." },
];

const ok = (answers: Record<string, Answer>): JudgeResult => ({
  ok: true, answers, usage: { input_tokens: 50, output_tokens: 5 }, model: "jev-1.13.0", ms: 100,
});
const noulA = (n: number): Answer => ({ type: "noul", noul: n });

const judgeWith = (result: JudgeResult) => {
  const calls: Array<{ state: unknown; questions: Record<string, Question> }> = [];
  return {
    calls,
    judge: (state: unknown, questions: Record<string, Question>) => {
      calls.push({ state, questions });
      return Promise.resolve(result);
    },
  };
};

const ARTICLE = { title: "How to get around Seoul", html: "<p>Take the subway.</p>", excerpt: "Getting around" };

Deno.test("activePrograms() leaves Agoda out until its id is configured", async () => {
  await withEnv({}, () => {
    const ids = activePrograms().map((p) => p.id);
    assert(ids.includes("klook"));
    assert(ids.includes("oliveyoung"));
    assert(!ids.includes("agoda"), "Agoda's approval is for another domain — it must stay off by default");
  });
});

Deno.test("activePrograms() includes Agoda once a cid is set", async () => {
  await withEnv({ AFFILIATE_AGODA_CID: "1973475" }, () => {
    const agoda = activePrograms().find((p) => p.id === "agoda");
    assert(agoda);
    assert(agoda.href.includes("cid=1973475"));
  });
});

Deno.test("activePrograms() drops a program whose id is blanked", async () => {
  await withEnv({ AFFILIATE_KLOOK_AID: "" }, () => {
    assert(!activePrograms().some((p) => p.id === "klook"));
  });
});

Deno.test("applyAffiliates() puts the disclosure above the first link", async () => {
  const { judge } = judgeWith(ok({ klook: noulA(0.9), oliveyoung: noulA(0.1) }));
  const { html, programs } = await applyAffiliates(ARTICLE, { judge, programs: PROGRAMS });

  assertEquals(programs, ["klook"]);
  const disclosureAt = html.indexOf("kbl-affiliate-disclosure");
  const linkAt = html.indexOf("<a href=");
  assert(disclosureAt >= 0 && linkAt >= 0);
  assert(disclosureAt < linkAt, "FTC requires the disclosure above the first affiliate link");
});

Deno.test("applyAffiliates() states the commission, not just 'affiliate link'", async () => {
  const { judge } = judgeWith(ok({ klook: noulA(0.9) }));
  const { html } = await applyAffiliates(ARTICLE, { judge, programs: PROGRAMS });

  assert(html.includes("may earn a commission"));
  assert(html.includes("doesn't change the price you pay"));
  assert(html.includes("Klook"), "the disclosure names the programs actually linked");
});

Deno.test("applyAffiliates() marks every affiliate link nofollow sponsored", async () => {
  const { judge } = judgeWith(ok({ klook: noulA(0.9), oliveyoung: noulA(0.8) }));
  const { html } = await applyAffiliates(ARTICLE, { judge, programs: PROGRAMS });

  const links = html.match(/<a [^>]*href="https?:[^"]*"[^>]*>/g) ?? [];
  assertEquals(links.length, 2);
  for (const l of links) assert(l.includes('rel="nofollow sponsored"'), l);
});

Deno.test("applyAffiliates() adds nothing when no program fits", async () => {
  const { judge } = judgeWith(ok({ klook: noulA(0.1), oliveyoung: noulA(0.05) }));
  const { html, programs } = await applyAffiliates(ARTICLE, { judge, programs: PROGRAMS });

  assertEquals(programs, []);
  assertEquals(html, "<p>Take the subway.</p>");
  assert(!html.includes("commission"), "an article with no fit gets no disclosure either");
});

Deno.test("applyAffiliates() caps how many blocks it inserts", async () => {
  const { judge } = judgeWith(ok({ klook: noulA(0.9), oliveyoung: noulA(0.85) }));
  const { programs } = await applyAffiliates(ARTICLE, { judge, programs: PROGRAMS, max: 1 });
  assertEquals(programs, ["klook"], "the better fit wins the single slot");
});

Deno.test("applyAffiliates() keeps the note that carries the discount code", async () => {
  const { judge } = judgeWith(ok({ oliveyoung: noulA(0.9), klook: noulA(0.1) }));
  const { html } = await applyAffiliates(ARTICLE, { judge, programs: PROGRAMS });
  assert(html.includes("Use code <strong>X</strong>."));
});

Deno.test("applyAffiliates() leaves the article alone when the judgement fails", async () => {
  const { judge } = judgeWith({ ok: false, error: "not_configured", message: "no key" });
  const { html, programs } = await applyAffiliates(ARTICLE, { judge, programs: PROGRAMS });
  assertEquals(programs, []);
  assertEquals(html, "<p>Take the subway.</p>");
});

Deno.test("re-running replaces the old blocks instead of stacking them", async () => {
  const { judge } = judgeWith(ok({ klook: noulA(0.9), oliveyoung: noulA(0.8) }));
  const first = await applyAffiliates(ARTICLE, { judge, programs: PROGRAMS });
  assert(hasAffiliates(first.html));

  const second = await applyAffiliates({ ...ARTICLE, html: first.html }, { judge, programs: PROGRAMS });
  assertEquals((second.html.match(/kbl-affiliate-disclosure/g) ?? []).length, 1);
  assertEquals((second.html.match(/kbl-affiliate-cta/g) ?? []).length, 2);
  assert(second.html.includes("<p>Take the subway.</p>"), "the article body survives a re-run");
});

Deno.test("stripAffiliates() returns the untouched article", async () => {
  const { judge } = judgeWith(ok({ klook: noulA(0.9) }));
  const { html } = await applyAffiliates(ARTICLE, { judge, programs: PROGRAMS });
  assertEquals(stripAffiliates(html), "<p>Take the subway.</p>");
  assertEquals(hasAffiliates(stripAffiliates(html)), false);
});

Deno.test("applyAffiliates() sends only the title and summary for judging", async () => {
  const { judge, calls } = judgeWith(ok({ klook: noulA(0.9) }));
  await applyAffiliates(ARTICLE, { judge, programs: PROGRAMS });

  const state = calls[0].state as { article: Record<string, unknown> };
  assertEquals(Object.keys(state.article).sort(), ["summary", "title"]);
  assertEquals(Object.keys(calls[0].questions).sort(), ["klook", "oliveyoung"]);
});
