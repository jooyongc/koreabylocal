import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
// @ts-expect-error -- CSS module imports handled by Vite
import "swiper/css";
// @ts-expect-error -- CSS module imports handled by Vite
import "swiper/css/pagination";

const HERO_SLIDES = [
  {
    id: 1,
    title: "More than travel,\nit's connection.",
    subtitle: "Travel meaningfully.",
    cta: { text: "for more Information — Click here!", href: "/about" },
    bg: "bg-gradient-to-br from-[#00005a] via-[#2a1a6e] to-[#6312ff]",
  },
  {
    id: 2,
    title: "Discover Korea\nthrough locals.",
    subtitle: "Authentic experiences, local expertise.",
    cta: { text: "Explore Tours", href: "/tours" },
    bg: "bg-gradient-to-br from-[#6312ff] via-[#3a0f7a] to-[#00005a]",
  },
  {
    id: 3,
    title: "Your Korean\nadventure starts here.",
    subtitle: "Curated by people who call Korea home.",
    cta: { text: "Browse Shop", href: "/shop" },
    bg: "bg-gradient-to-br from-[#00005a] via-[#4a1490] to-[#d930ff]",
  },
];

export default function HeroSection() {
  return (
    <section className="relative">
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        loop
        className="hero-swiper"
      >
        {HERO_SLIDES.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div
              className={`relative flex min-h-[70vh] items-center justify-center px-4 md:min-h-[80vh] ${slide.bg}`}
            >
              {/* Dark overlay for text readability */}
              <div className="absolute inset-0 bg-black/20" />

              <div className="relative z-10 mx-auto max-w-3xl text-center text-white">
                <h1 className="whitespace-pre-line text-3xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
                  {slide.title}
                </h1>
                <p className="mt-4 text-lg font-light tracking-wide text-white/80 md:text-xl">
                  {slide.subtitle}
                </p>
                <Link
                  to={slide.cta.href}
                  className="group mt-8 inline-flex items-center gap-2 rounded-full border-2 border-white/80 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white hover:text-primary md:text-base"
                >
                  {slide.cta.text}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
