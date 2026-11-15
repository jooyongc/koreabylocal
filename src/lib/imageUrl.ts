// Image sizing shared by OptimizedImage and the Pages middleware's hero preload.
// No imports on purpose: functions/_meta.ts pulls this in too, and both sides
// must produce the same URLs or the preloaded hero gets downloaded twice.

/**
 * Widths of the WebP copies stored for every public Supabase image, at
 * images/_v/<bucket>/<name>.w<width>.webp. Made once per upload (pg_cron →
 * the image-variants edge function; scripts/image-variants.mjs for the
 * backfill), never per view: Supabase bills on-the-fly resizing per original
 * image per month, and the site shows several hundred. Keep in step with
 * both of those and supabase/migrations/20261115000000_image_variants.sql.
 */
export const VARIANT_WIDTHS = [400, 600, 800, 1200, 1920] as const;
const VARIANT_BUCKETS = ["images", "product-images", "workboard-media", "magazines"];
const SUPABASE_PUBLIC = /^\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/;

/** The stored width that stands in for `width`: the next one up, never softer. */
function variantWidth(width: number): number {
  return VARIANT_WIDTHS.find((w) => w >= width) ?? VARIANT_WIDTHS[VARIANT_WIDTHS.length - 1];
}

function storedCopy(u: URL, width: number): string | null {
  const match = u.pathname.match(SUPABASE_PUBLIC);
  if (!match) return null;
  const [, bucket, name] = match;
  if (!VARIANT_BUCKETS.includes(bucket) || (bucket === "images" && name.startsWith("_v/"))) return null;
  if (!/\.(jpe?g|png|webp)$/i.test(name)) return null;
  return `${u.origin}/storage/v1/object/public/images/_v/${bucket}/${name}.w${variantWidth(width)}.webp`;
}

const isSupabase = (url: string) => {
  try {
    return new URL(url).hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
};

/**
 * Returns a resized variant of an image URL when one exists or its host can
 * resize, or null.
 *
 * - Supabase Storage: the stored WebP copy (above). A copy not made yet —
 *   an upload from the last few minutes — fails to load and OptimizedImage
 *   falls back to the original.
 * - Unsplash / Pexels: both resize through their own query params.
 * - Anything else (e.g. the old imweb CDN) can't be resized here.
 */
export function resizedUrl(url: string, width: number, quality = 75): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.endsWith(".supabase.co")) return storedCopy(u, width);
    if (u.hostname === "images.unsplash.com") {
      u.searchParams.set("w", String(width));
      u.searchParams.set("q", String(quality));
      u.searchParams.set("auto", "format");
      u.searchParams.set("fit", "max");
      return u.toString();
    }
    if (u.hostname === "images.pexels.com") {
      u.searchParams.set("auto", "compress");
      u.searchParams.set("cs", "tinysrgb");
      u.searchParams.set("w", String(width));
      return u.toString();
    }
  } catch {
    // Not an absolute URL (e.g. a /public asset) — nothing to resize.
  }
  return null;
}

/** Preset sizes for srcset generation */
export const PRESETS = {
  thumbnail: { widths: [200, 400], sizes: "(max-width: 640px) 50vw, 200px" },
  card: { widths: [300, 600], sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px" },
  detail: { widths: [600, 900, 1200], sizes: "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 600px" },
  full: { widths: [800, 1200, 1600], sizes: "100vw" },
  hero: { widths: [800, 1200, 1920], sizes: "100vw" },
} as const;

export type PresetKey = keyof typeof PRESETS;

export interface ResponsiveImage {
  src: string;
  srcSet?: string;
  sizes?: string;
}

/** src/srcset/sizes for an <img> — srcset only when the host can resize. */
export function responsiveImage(src: string, preset: PresetKey = "card", quality = 75): ResponsiveImage {
  const config = PRESETS[preset];
  const middle = config.widths[Math.floor(config.widths.length / 2)];
  const resized = resizedUrl(src, middle, quality);
  if (!resized) return { src };
  // Stored copies come in fixed widths: list each once, under its own width.
  const widths = isSupabase(src) ? [...new Set(config.widths.map(variantWidth))] : config.widths;
  return {
    src: resized,
    srcSet: widths.map((w) => `${resizedUrl(src, w, quality)} ${w}w`).join(", "),
    sizes: config.sizes,
  };
}
