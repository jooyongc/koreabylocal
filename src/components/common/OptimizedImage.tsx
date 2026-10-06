import { useState, memo } from "react";
import { responsiveImage, type PresetKey } from "@/lib/imageUrl";

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

/**
 * Responsive, lazily loaded image. Lazy loading is the browser's own
 * (loading="lazy"): the previous IntersectionObserver swap downloaded a
 * "20px placeholder" first, which for hosts that can't resize was the full
 * original — every card fetched its full-size image before scrolling into view.
 */
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
  const img = responsiveImage(src, preset, quality);

  return (
    <img
      src={img.src}
      srcSet={img.srcSet}
      sizes={img.sizes}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : undefined}
      onLoad={() => setLoaded(true)}
      onClick={onClick}
      className={`transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-70"} ${className}`}
    />
  );
}

const OptimizedImage = memo(OptimizedImageInner);
export default OptimizedImage;
