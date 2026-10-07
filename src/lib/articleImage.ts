// Which picture stands for an article where.
//
// An article has two kinds of image, and they must not be swapped:
//   - its photo: the first image in the body. Card thumbnails are drawn over it.
//   - its card thumbnail: that photo with the headline drawn in
//     (generateThumbnail.ts). Made for list cards only — used as a background
//     behind the real title, the headline shows twice.

/** The first image in an article body, or null when the body has none. */
export function firstBodyImage(html: string | null | undefined): string | null {
  const m = /<img\b[^>]*?\ssrc\s*=\s*(["'])(.+?)\1/i.exec(html ?? "");
  return m ? m[2].replace(/&amp;/g, "&") : null;
}

/** Whether a URL is one of our generated card thumbnails (headline drawn in). */
export const isCardThumbnail = (url: string | null | undefined): boolean =>
  !!url && url.includes("/storage/v1/object/public/images/thumbnails/");

/** The first of `urls` that is a photo rather than a card thumbnail. */
export const firstPhoto = (...urls: (string | null | undefined)[]): string | null =>
  urls.find((u): u is string => !!u && !isCardThumbnail(u)) ?? null;
