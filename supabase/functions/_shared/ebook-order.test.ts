// deno test supabase/functions/_shared/ebook-order.test.ts
import { assert, assertEquals, assertFalse } from "jsr:@std/assert@1";
import {
  buildDeliveryEmail,
  coversPrice,
  ebookReference,
  generateDownloadToken,
  parseEbookReference,
  priceString,
} from "./ebook-order.ts";

Deno.test("a book's reference round-trips", () => {
  assertEquals(ebookReference(7), "ebook-7");
  assertEquals(parseEbookReference(ebookReference(7)), 7);
});

Deno.test("an Ask a Local order is not a book order", () => {
  // Ask a Local puts the bare inquiry id in reference_id.
  assertEquals(parseEbookReference("42"), null);
  assertEquals(parseEbookReference(null), null);
  assertEquals(parseEbookReference("ebook-"), null);
  assertEquals(parseEbookReference("ebook-0"), null);
  assertEquals(parseEbookReference("ebook-3; drop"), null);
  assertEquals(parseEbookReference("x-ebook-3"), null);
});

Deno.test("prices go to PayPal with two decimals", () => {
  assertEquals(priceString(12), "12.00");
  assertEquals(priceString("9.9"), "9.90");
});

Deno.test("capture must cover the price, in USD", () => {
  assert(coversPrice({ amount: "12.00", currency: "USD" }, "12.00"));
  assert(coversPrice({ amount: "12.01", currency: "USD" }, 12));
  assertFalse(coversPrice({ amount: "0.01", currency: "USD" }, "12.00"), "a cent must not buy the book");
  assertFalse(coversPrice({ amount: "12.00", currency: "JPY" }, "12.00"));
  assertFalse(coversPrice({ amount: null, currency: "USD" }, "12.00"));
});

Deno.test("download tokens are long and not repeated", () => {
  const a = generateDownloadToken();
  assertEquals(a.length, 48);
  assert(/^[0-9a-f]+$/.test(a));
  assert(a !== generateDownloadToken());
});

Deno.test("the delivery email escapes what we did not write", () => {
  const { subject, html } = buildDeliveryEmail({
    title: "Seoul <Secrets>",
    buyerName: "<b>Kim</b> Lee",
    downloadUrl: "https://koreabylocal.com/ebook/download/abc",
    maxDownloads: 3,
    siteUrl: "https://koreabylocal.com",
  });
  assertEquals(subject, "Your e-book: Seoul <Secrets>");
  assert(html.includes("Seoul &lt;Secrets&gt;"));
  assert(html.includes("Hi &lt;b&gt;Kim&lt;/b&gt;,"));
  assertFalse(html.includes("<b>Kim"));
  assert(html.includes('href="https://koreabylocal.com/ebook/download/abc"'));
  assert(html.includes("works 3 times"));
});

Deno.test("the delivery email greets a buyer with no name", () => {
  const { html } = buildDeliveryEmail({
    title: "Guide",
    buyerName: null,
    downloadUrl: "https://koreabylocal.com/ebook/download/abc",
    maxDownloads: 3,
    siteUrl: "https://koreabylocal.com",
  });
  assert(html.includes("Hi there,"));
});

Deno.test("a free copy's email talks about a gift, not a purchase", () => {
  const { subject, html } = buildDeliveryEmail({
    title: "Free 10-Step Korea Prep Guide",
    buyerName: null,
    downloadUrl: "https://koreabylocal.com/ebook/download/abc",
    maxDownloads: 3,
    siteUrl: "https://koreabylocal.com",
    free: true,
  });
  assertEquals(subject, "Your free guide: Free 10-Step Korea Prep Guide");
  assert(html.includes("here's your free copy of"));
  assertFalse(html.includes("PayPal"));
  assertFalse(html.includes("refund"));
  assertFalse(html.includes("thank you for buying"));
});

Deno.test("a bought copy's email keeps the receipt wording", () => {
  const { html } = buildDeliveryEmail({
    title: "Guide",
    buyerName: "Ana",
    downloadUrl: "https://koreabylocal.com/ebook/download/abc",
    maxDownloads: 3,
    siteUrl: "https://koreabylocal.com",
  });
  assert(html.includes("thank you for buying"));
  assert(html.includes("Payment was taken by PayPal."));
  assert(html.includes("full refund within 7 days"));
});
