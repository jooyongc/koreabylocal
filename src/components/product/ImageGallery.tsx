import { useState, useCallback, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
// @ts-expect-error -- CSS module imports handled by Vite
import "swiper/css";
// @ts-expect-error -- CSS module imports handled by Vite
import "swiper/css/pagination";

function parseImages(images: unknown): string[] {
  if (!images) return [];
  if (Array.isArray(images)) {
    return images.filter((img): img is string => typeof img === "string");
  }
  return [];
}

interface ImageGalleryProps {
  images: unknown;
  thumbnailUrl: string | null;
  title: string;
}

export default function ImageGallery({
  images,
  thumbnailUrl,
  title,
}: ImageGalleryProps) {
  const allImages = parseImages(images);
  // If thumbnail is separate from images array, prepend it
  if (thumbnailUrl && !allImages.includes(thumbnailUrl)) {
    allImages.unshift(thumbnailUrl);
  }
  // Fallback if no images at all
  if (allImages.length === 0 && thumbnailUrl) {
    allImages.push(thumbnailUrl);
  }

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const openLightbox = useCallback((index: number) => {
    setLightboxOpen(true);
    setSelectedIndex(index);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const goNext = useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % allImages.length);
  }, [allImages.length]);

  const goPrev = useCallback(() => {
    setSelectedIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  }, [allImages.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, closeLightbox, goNext, goPrev]);

  if (allImages.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl bg-background-gray text-text-secondary/30">
        <svg className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Gallery */}
      <div className="hidden lg:block">
        {/* Main image */}
        <button
          type="button"
          onClick={() => openLightbox(selectedIndex)}
          className="w-full cursor-zoom-in overflow-hidden rounded-xl bg-background-gray"
        >
          <img
            src={allImages[selectedIndex]}
            alt={`${title} - ${selectedIndex + 1}`}
            className="aspect-square w-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </button>

        {/* Thumbnails */}
        {allImages.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {allImages.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedIndex(i)}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                  i === selectedIndex
                    ? "border-primary ring-1 ring-primary"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={url}
                  alt={`${title} thumbnail ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Swiper */}
      <div className="lg:hidden">
        <Swiper
          modules={[Pagination]}
          pagination={{ clickable: true }}
          className="product-gallery-swiper overflow-hidden rounded-xl"
          onSlideChange={(swiper) => setSelectedIndex(swiper.activeIndex)}
        >
          {allImages.map((url, i) => (
            <SwiperSlide key={i}>
              <button
                type="button"
                onClick={() => openLightbox(i)}
                className="w-full cursor-zoom-in"
              >
                <img
                  src={url}
                  alt={`${title} - ${i + 1}`}
                  className="aspect-square w-full object-cover"
                />
              </button>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Navigation */}
          {allImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute left-4 z-10 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute right-4 z-10 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Image */}
          <img
            src={allImages[selectedIndex]}
            alt={`${title} - ${selectedIndex + 1}`}
            className="max-h-[85vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white backdrop-blur-sm">
            {selectedIndex + 1} / {allImages.length}
          </div>
        </div>
      )}
    </>
  );
}
