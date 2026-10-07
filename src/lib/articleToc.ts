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
 * The body's images load lazily and have no height until they do, so passing
 * them pushed the heading ~400px further down and the jump fell short. Each
 * image above the heading re-aims the scroll as it arrives, for a few seconds
 * or until the reader scrolls themselves.
 */
export function scrollToSection(id: string): void {
  const target = document.getElementById(id);
  if (!target) return;
  const aim = () => target.scrollIntoView({ behavior: "smooth", block: "start" });
  aim();

  const pending = Array.from(target.closest("article")?.querySelectorAll("img") ?? []).filter(
    (img) => !img.naturalWidth && img.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING,
  );
  if (pending.length === 0) return;

  const READER_INPUT = ["wheel", "touchstart", "keydown"] as const;
  let following = true;
  const stop = () => {
    following = false;
    READER_INPUT.forEach((type) => window.removeEventListener(type, stop));
  };
  READER_INPUT.forEach((type) => window.addEventListener(type, stop, { passive: true }));
  window.setTimeout(stop, 5000);

  for (const img of pending) {
    img.loading = "eager";
    img.addEventListener("load", () => following && aim(), { once: true });
  }
}
