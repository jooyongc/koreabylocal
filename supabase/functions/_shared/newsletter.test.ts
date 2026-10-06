// deno test supabase/functions/_shared/newsletter.test.ts
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { remainingToday, renderNewsletter, styleBody, unsubscribeHeaders } from "./newsletter.ts";

Deno.test("styleBody inlines styles on the tags the editor produces", () => {
  const out = styleBody('<p>Hi <a href="https://x.test">there</a></p><ul><li>One</li></ul>');
  assertStringIncludes(out, '<p style="margin:0 0 16px');
  assertStringIncludes(out, '<a href="https://x.test" style="color:#ff2e97');
  assertStringIncludes(out, '<ul style="');
  assertStringIncludes(out, '<li style="');
});

Deno.test("styleBody keeps a style the author wrote by hand", () => {
  const html = '<p style="color:red">Mine</p>';
  assertEquals(styleBody(html), html);
});

Deno.test("styleBody keeps self-closing tags self-closing", () => {
  assertEquals(
    styleBody('<img src="a.png" />'),
    '<img src="a.png" style="max-width:100%;height:auto;border-radius:10px" />',
  );
});

Deno.test("styleBody leaves tags that only start with a known name alone", () => {
  // <abbr>, <pre>, <article> must not be mistaken for <a>, <p>.
  const html = "<abbr>KTX</abbr><pre>x</pre><article>y</article>";
  assertEquals(styleBody(html), html);
});

Deno.test("renderNewsletter carries the unsubscribe link and escapes the preheader", () => {
  const html = renderNewsletter({
    bodyHtml: "<p>Body</p>",
    preheader: 'Tips & "deals"',
    unsubscribeUrl: "https://koreabylocal.com/unsubscribe?token=abc",
    siteUrl: "https://koreabylocal.com",
  });
  assertStringIncludes(html, 'href="https://koreabylocal.com/unsubscribe?token=abc"');
  assertStringIncludes(html, "Tips &amp; &quot;deals&quot;");
  assertStringIncludes(html, '<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#374151">Body</p>');
});

Deno.test("renderNewsletter adds the postal address only when one is set", () => {
  const base = { bodyHtml: "<p>x</p>", unsubscribeUrl: "https://u.test", siteUrl: "https://s.test" };
  assert(!renderNewsletter(base).includes("Korea by Local ·"));
  assertStringIncludes(renderNewsletter({ ...base, postalAddress: "Seoul, Korea" }), "Korea by Local · Seoul, Korea");
});

Deno.test("unsubscribeHeaders follows RFC 8058", () => {
  assertEquals(unsubscribeHeaders("https://fn.test/u?token=t"), {
    "List-Unsubscribe": "<https://fn.test/u?token=t>",
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  });
  assertEquals(
    unsubscribeHeaders("https://fn.test/u?token=t", "news@x.test")["List-Unsubscribe"],
    "<https://fn.test/u?token=t>, <mailto:news@x.test?subject=unsubscribe>",
  );
});

Deno.test("remainingToday never goes negative", () => {
  assertEquals(remainingToday(120, 400), 280);
  assertEquals(remainingToday(450, 400), 0);
});
