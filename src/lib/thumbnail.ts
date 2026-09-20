// Builds a card thumbnail from an article's own photo: the photo on the right,
// a category-coloured wash on the left, the headline over it.
//
// Two things the earlier thumbnails got wrong, and the reasons they are
// constraints here rather than preferences:
//
//   1. The category word was baked into the image. The card already draws its
//      own badge at top-left, so the two collided and neither was readable.
//      Nothing is drawn in that corner now, and the category is conveyed by
//      colour alone.
//   2. They were 4:3 in a 16:10 card, so the bottom of every headline was
//      cropped away. These render at the card's own ratio, and the headline
//      stays inside a band that survives the 16:8 crop the article hero uses.

/** The card ratio (16:10). The article hero crops this to 16:8 from the centre. */
export const THUMB_WIDTH = 1200;
export const THUMB_HEIGHT = 750;

/** Kept clear for the card's own category badge. */
const BADGE_SAFE_TOP = 96;

/**
 * The 16:8 hero crop removes 12.5% from the top and bottom, so the headline
 * lives inside the middle 75% or it loses its first and last lines there.
 */
const SAFE_TOP = Math.max(BADGE_SAFE_TOP, THUMB_HEIGHT * 0.125 + 24);
const SAFE_BOTTOM = THUMB_HEIGHT * 0.125 + 24;

const MARGIN_X = 64;
/** The wash column. The photo keeps the right side. */
const TEXT_WIDTH = THUMB_WIDTH * 0.56 - MARGIN_X;

/**
 * One brand colour per Guidebook section. Chosen so a reader can tell sections
 * apart in a grid at a glance, which the old thumbnails could not do — orange
 * was serving K-culture, transport and news at the same time.
 */
export const CATEGORY_COLORS: Record<string, string> = {
  "TRANSPORT": "#5b2bff",
  "FOOD": "#e84b2a",
  "K-CULTURE": "#ff2e97",
  "FESTIVAL": "#f2b705",
  "LOCAL-LIFE": "#0e8c6a",
  "HOW-TO": "#12184a",
  // Pre-Guidebook categories, until they are reclassified.
  "NEWS": "#12184a",
  "LOCALS": "#0e8c6a",
  "KOREAN": "#5b2bff",
};

const FALLBACK_COLOR = "#12184a";

export const colorForCategory = (category: string | null | undefined): string =>
  CATEGORY_COLORS[String(category ?? "").toUpperCase()] ?? FALLBACK_COLOR;

/** Gold is too light to carry white text; everything else is dark enough. */
const textColorOn = (hex: string) => (hex.toLowerCase() === "#f2b705" ? "#12184a" : "#ffffff");

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

const FONT_FAMILY = '"Noto Sans", "Noto Sans KR", sans-serif';
const FONT_CSS =
  "https://fonts.googleapis.com/css2?family=Noto+Sans:wght@800&family=Noto+Sans+KR:wght@800&display=swap";

/**
 * Canvas draws with whatever the machine has, so the webfont is loaded and
 * awaited before anything is measured. Without this the same article would
 * render differently on different editors' laptops, and the line-wrapping —
 * which is measured against the font — would be wrong too.
 *
 * Titles mix Latin and Hangul, so the text is passed to load(): the browser
 * only fetches the subsets the glyphs actually need.
 */
async function ensureFonts(text: string): Promise<void> {
  if (!document.getElementById("kbl-thumb-fonts")) {
    const link = document.createElement("link");
    link.id = "kbl-thumb-fonts";
    link.rel = "stylesheet";
    link.href = FONT_CSS;
    document.head.appendChild(link);
  }
  try {
    await Promise.all([
      document.fonts.load(`800 80px "Noto Sans"`, text),
      document.fonts.load(`800 80px "Noto Sans KR"`, text),
    ]);
  } catch {
    // Falls back to the system sans-serif rather than failing the save.
  }
}

/** Loads an image for the canvas, asking the host to allow reading the pixels back. */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Without this the canvas is tainted and toBlob() throws. Supabase storage
    // and Unsplash both send permissive CORS headers.
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load image: ${url}`));
    img.src = url;
  });
}

/** Draws the image cover-style into a box, cropping the overflow like CSS does. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, w: number, h: number,
) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

/** Greedy wrap that also breaks a word too long to fit on its own line. */
export function wrapLines(
  measure: (text: string) => number,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (measure(next) <= maxWidth || !line) {
      line = next;
      continue;
    }
    lines.push(line);
    line = word;
    if (lines.length === maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);

  // Anything that did not fit gets an ellipsis rather than silently vanishing.
  if (lines.length === maxLines) {
    const used = lines.join(" ").split(/\s+/).length;
    if (used < words.length) {
      let last = lines[maxLines - 1];
      while (last && measure(`${last}…`) > maxWidth) last = last.replace(/\s*\S+$/, "");
      lines[maxLines - 1] = `${last}…`;
    }
  }
  return lines;
}

export interface ThumbnailOptions {
  title: string;
  category: string | null | undefined;
  /** The article's own photo. Without one the wash fills the frame. */
  imageUrl?: string | null;
}

/**
 * Renders the thumbnail and returns it as a JPEG blob.
 *
 * Throws only if the canvas itself is unavailable — a photo that fails to load
 * falls back to a plain coloured card, which is still a usable thumbnail.
 */
export async function renderThumbnail(opts: ThumbnailOptions): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = THUMB_WIDTH;
  canvas.height = THUMB_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser");

  await ensureFonts(opts.title);

  const color = colorForCategory(opts.category);
  const [r, g, b] = hexToRgb(color);

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, THUMB_WIDTH, THUMB_HEIGHT);

  if (opts.imageUrl) {
    try {
      const img = await loadImage(opts.imageUrl);
      drawCover(ctx, img, 0, 0, THUMB_WIDTH, THUMB_HEIGHT);
    } catch {
      // Leave the flat colour — better than failing the whole save.
    }
  }

  // Opaque behind the headline, clear over the photo, so the text is always
  // legible no matter how busy or bright the picture is.
  const wash = ctx.createLinearGradient(0, 0, THUMB_WIDTH, 0);
  wash.addColorStop(0, `rgba(${r},${g},${b},1)`);
  wash.addColorStop(0.42, `rgba(${r},${g},${b},0.97)`);
  wash.addColorStop(0.68, `rgba(${r},${g},${b},0.55)`);
  wash.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, THUMB_WIDTH, THUMB_HEIGHT);

  // Headline. Sized to fit rather than truncated: a four-line title simply
  // sets smaller, which reads better than three lines and an ellipsis.
  const fill = textColorOn(color);
  ctx.fillStyle = fill;
  ctx.textBaseline = "top";

  const band = THUMB_HEIGHT - SAFE_TOP - SAFE_BOTTOM;
  let size = 84;
  let lines: string[] = [];
  const font = (px: number) => `800 ${px}px ${FONT_FAMILY}`;

  // Shrinks to fit rather than truncating: a long title simply sets smaller,
  // which reads better than four lines and an ellipsis. Five lines are allowed
  // because the larger type needs the extra room.
  for (; size >= 46; size -= 4) {
    ctx.font = font(size);
    lines = wrapLines((t) => ctx.measureText(t).width, opts.title, TEXT_WIDTH, 5);
    if (lines.length * size * 1.16 <= band) break;
  }

  ctx.font = font(size);
  const lineHeight = size * 1.16;
  const blockHeight = lines.length * lineHeight;
  let y = SAFE_TOP + Math.max(0, (band - blockHeight) / 2);

  for (const line of lines) {
    ctx.fillText(line, MARGIN_X, y);
    y += lineHeight;
  }

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the thumbnail"))),
      "image/jpeg",
      0.88,
    );
  });
}

/** First <img> in the article body — the photo the writer already chose. */
export function firstImageIn(html: string | null | undefined): string | null {
  const m = String(html ?? "").match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}
