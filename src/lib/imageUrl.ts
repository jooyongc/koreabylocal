// Image sizing shared by OptimizedImage and the Pages middleware's hero preload.
// No imports on purpose: functions/_meta.ts pulls this in too, and both sides
// must produce the same URLs or the preloaded hero gets downloaded twice.

/**
 * Returns a resized variant of an image URL when its host can resize, or null.
 *
 * - Supabase Storage: the public object URL ignores size params; resizing lives
 *   at /storage/v1/render/image/public/… (and serves WebP to browsers that take it).
 * - Unsplash / Pexels: both resize through their own query params.
 * - Anything else (e.g. the old imweb CDN) can't be resized here.
 */
export function resizedUrl(url: string, width: number, quality = 75): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.endsWith(".supabase.co") && u.pathname.includes("/storage/v1/object/public/")) {
      u.pathname = u.pathname.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
      u.searchParams.set("width", String(width));
      u.searchParams.set("quality", String(quality));
      // The default ("cover") keeps the original height when only a width is
      // given, so a 1200x750 thumbnail came back as a 300x750 crop. "contain"
      // scales to the width and keeps the aspect ratio.
      u.searchParams.set("resize", "contain");
      return u.toString();
    }
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
  return {
    src: resized,
    srcSet: config.widths.map((w) => `${resizedUrl(src, w, quality)} ${w}w`).join(", "),
    sizes: config.sizes,
  };
}
