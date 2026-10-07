// The "In this story" sections of an article body.
//
// The ids are written into the HTML before it is rendered, not set on the DOM
// afterwards: React 19 re-applies dangerouslySetInnerHTML every time the
// element re-renders, which wiped ids added after the first paint and left
// every link pointing at nothing.

export interface TocItem {
  id: string;
  text: string;
}

/** The body with an id on every <h2>, and the list of those sections. */
export function withSectionIds(html: string): { html: string; toc: TocItem[] } {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const toc: TocItem[] = [];
  doc.body.querySelectorAll("h2").forEach((h, i) => {
    const text = (h.textContent ?? "").trim();
    if (!text) return;
    if (!h.id) h.id = `sec-${i}-${text.toLowerCase().replace(/[^\w]+/g, "-").slice(0, 40)}`;
    toc.push({ id: h.id, text });
  });
  return { html: doc.body.innerHTML, toc };
}

/**
 * Scrolls to a section heading, and keeps it in place while the page settles.
 *
 * Lazy images, the webfont and embedded product cards all change height after
 * the first paint — an image above the heading pushed it ~400px down
 * mid-scroll and the jump fell short. So the scroll is re-aimed whenever the
 * page changes size, for a few seconds or until the reader scrolls themselves.
 */
export function scrollToSection(id: string): void {
  const target = document.getElementById(id);
  if (!target) return;
  const aim = () => target.scrollIntoView({ behavior: "smooth", block: "start" });

  // The images above the heading are the main culprit: fetch them now.
  target
    .closest("article")
    ?.querySelectorAll("img")
    .forEach((img) => {
      if (img.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING) img.loading = "eager";
    });

  const READER_INPUT = ["wheel", "touchstart", "keydown"] as const;
  const resized = new ResizeObserver(aim); // also fires once on observe, which does the first aim
  const stop = () => {
    resized.disconnect();
    READER_INPUT.forEach((type) => window.removeEventListener(type, stop));
  };
  READER_INPUT.forEach((type) => window.addEventListener(type, stop, { passive: true }));
  window.setTimeout(stop, 5000);
  resized.observe(document.body);
}
