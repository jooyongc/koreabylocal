import { useState, useRef, useEffect, memo } from "react";

/**
 * Supabase Storage image transform helper.
 * Appends render/image/t_ query params for server-side resizing + WebP.
 * Only transforms Supabase storage URLs; external URLs pass through as-is.
 */
function transformUrl(
  url: string,
  width: number,
  quality = 75,
): string {
  if (!url) return url;
  // Only transform Supabase storage URLs
  if (!url.includes("supabase.co/storage")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}width=${width}&quality=${quality}&format=webp`;
}

/** Preset sizes for srcset generation */
const PRESETS = {
  thumbnail: { widths: [200, 400], sizes: "(max-width: 640px) 50vw, 200px" },
  card: { widths: [300, 600], sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px" },
  detail: { widths: [600, 900, 1200], sizes: "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 600px" },
  full: { widths: [800, 1200, 1600], sizes: "100vw" },
  hero: { widths: [800, 1200, 1920], sizes: "100vw" },
} as const;

type PresetKey = keyof typeof PRESETS;

interface OptimizedImageProps {
  src: string;
  alt: string;
  preset?: PresetKey;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  onClick?: React.MouseEventHandler<HTMLImageElement>;
}

function OptimizedImageInner({
  src,
  alt,
  preset = "card",
  className = "",
  priority = false,
  quality = 75,
  onClick,
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || inView) return;
    const el = imgRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [priority, inView]);

  const config = PRESETS[preset];

  // Build srcset from widths
  const srcSet = config.widths
    .map((w) => `${transformUrl(src, w, quality)} ${w}w`)
    .join(", ");

  // Default src = middle size
  const defaultSrc = transformUrl(
    src,
    config.widths[Math.floor(config.widths.length / 2)],
    quality,
  );

  // Tiny LQIP placeholder (20px wide, heavily compressed)
  const lqipSrc = transformUrl(src, 20, 20);

  return (
    <img
      ref={imgRef}
      src={inView ? defaultSrc : lqipSrc}
      srcSet={inView ? srcSet : undefined}
      sizes={inView ? config.sizes : undefined}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : undefined}
      onLoad={() => setLoaded(true)}
      onClick={onClick}
      className={`transition-opacity duration-300 ${
        inView && loaded ? "opacity-100" : "opacity-70"
      } ${className}`}
    />
  );
}

const OptimizedImage = memo(OptimizedImageInner);
export default OptimizedImage;
export { transformUrl, PRESETS };
