// deno test supabase/functions/_shared/claims.test.ts
import { assert, assertEquals } from "jsr:@std/assert@1";
import { claimKinds, findClaims, htmlToText, toSentences } from "./claims.ts";

Deno.test("htmlToText() drops tags and decodes entities", () => {
  const text = htmlToText('<p>Take the <b>KTX</b> &amp; save 30&nbsp;minutes.</p>');
  assert(text.includes("KTX"));
  assert(text.includes("&"));
  assert(text.includes("30 minutes"));
  assert(!text.includes("<b>"));
});

Deno.test("htmlToText() removes script and style content entirely", () => {
  const text = htmlToText('<style>.a{color:red}</style><p>Hello</p><script>var x=1;</script>');
  assert(!text.includes("color"));
  assert(!text.includes("var x"));
  assert(text.includes("Hello"));
});

Deno.test("toSentences() keeps blocks apart so paragraphs never merge", () => {
  const s = toSentences("<p>The fare is 1,350 won</p><p>Buses run early</p>");
  assertEquals(s, ["The fare is 1,350 won", "Buses run early"]);
});

Deno.test("toSentences() splits list items separately", () => {
  const s = toSentences("<ul><li>Gate 3 opens at 06:00</li><li>Gate 4 opens at 07:00</li></ul>");
  assertEquals(s.length, 2);
});

Deno.test("toSentences() splits on terminal punctuation", () => {
  const s = toSentences("<p>It costs 1,350 won. Buy a T-money card first! Is it worth it? Yes.</p>");
  assertEquals(s.length, 4);
});

Deno.test("toSentences() does not split a decimal point", () => {
  const s = toSentences("<p>The ride takes 1.5 hours from Seoul.</p>");
  assertEquals(s, ["The ride takes 1.5 hours from Seoul."]);
});

Deno.test("toSentences() does not split after a common abbreviation", () => {
  const s = toSentences("<p>Bring a card, e.g. T-money, before you board.</p>");
  assertEquals(s.length, 1, s.join(" | "));
});

Deno.test("toSentences() handles Korean sentence openers", () => {
  const s = toSentences("<p>The fare is cheap. 한국에서는 티머니를 씁니다.</p>");
  assertEquals(s.length, 2);
});

Deno.test("claimKinds() recognises money in several notations", () => {
  for (const t of ["It costs ₩1,350 total", "It costs KRW 5000 total", "It costs $12 total", "It costs 1,350 won total", "It costs 3000원 total"]) {
    assert(claimKinds(t).includes("money"), t);
  }
});

Deno.test("claimKinds() recognises clock times and opening hours", () => {
  assert(claimKinds("The gate opens at 09:00 every day").includes("time"));
  assert(claimKinds("The gate opens at 6am every day").includes("time"));
  assert(claimKinds("The gate opens at 6 p.m. every day").includes("time"));
});

Deno.test("claimKinds() recognises durations, distances, phones and dates", () => {
  assert(claimKinds("The walk takes 40 minutes from the station").includes("duration"));
  assert(claimKinds("The beach is 5 km from the station").includes("distance"));
  assert(claimKinds("The beach is 300 meters from the station").includes("distance"));
  assert(claimKinds("Call 02-1234-5678 to reserve a table").includes("phone"));
  assert(claimKinds("The festival returns in 2026 to Suwon").includes("date"));
  assert(claimKinds("The festival opens on March 3 in Suwon").includes("date"));
});

Deno.test("claimKinds() returns nothing for prose without figures", () => {
  assertEquals(claimKinds("Annyeong! This is my favourite hidden gem in Seoul."), []);
  assertEquals(claimKinds("As a local, I always take the scenic route home."), []);
});

Deno.test("claimKinds() reports every kind a sentence carries", () => {
  const kinds = claimKinds("The 5 km ride costs 1,350 won and takes 40 minutes from 09:00");
  for (const k of ["distance", "money", "duration", "time"]) assert(kinds.includes(k as never), `${k} missing`);
});

Deno.test("findClaims() returns only the sentences carrying figures", () => {
  const html = `
    <p>Annyeong (hello)! Seoul's buses are a hidden gem.</p>
    <p>A single ride costs 1,350 won with a T-money card.</p>
    <p>As a local, I always tap in at the front door.</p>
    <p>The first bus leaves at 04:30 from Gangnam Station.</p>`;
  const claims = findClaims(html);
  assertEquals(claims.length, 2);
  assert(claims.some((c) => c.sentence.includes("1,350 won")));
  assert(claims.some((c) => c.sentence.includes("04:30")));
  assert(!claims.some((c) => c.sentence.includes("hidden gem")));
});

Deno.test("findClaims() skips fragments too short to assert anything", () => {
  assertEquals(findClaims("<h2>Prices in 2026</h2>"), []);
});

Deno.test("findClaims() de-duplicates a sentence repeated in the article", () => {
  const html = "<p>A single ride costs 1,350 won with a card.</p><p>A single ride costs 1,350 won with a card.</p>";
  assertEquals(findClaims(html).length, 1);
});

Deno.test("findClaims() caps the list, keeping the most substantial claims", () => {
  const long = Array.from({ length: 30 }, (_, i) =>
    `<p>This is a considerably longer sentence about fares numbered ${i} costing ${1000 + i} won today.</p>`).join("");
  const short = Array.from({ length: 30 }, (_, i) => `<p>Short one costs ${i} won here.</p>`).join("");
  const claims = findClaims(short + long, 10);

  assertEquals(claims.length, 10);
  assert(claims.every((c) => c.sentence.includes("considerably longer")), "longest claims should survive the cap");
});

Deno.test("findClaims() returns nothing for an article with no figures at all", () => {
  assertEquals(findClaims("<p>Annyeong! Come wander Euljiro with me and find your own favourite alley.</p>"), []);
});
