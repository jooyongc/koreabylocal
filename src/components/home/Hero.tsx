import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useHeroPosts, type HeroPostRow } from "@/hooks/useConcepts";
import OptimizedImage from "@/components/common/OptimizedImage";

const AREAS = ["KOREA TRAVEL GUIDE", "SEOUL", "BUSAN", "JEJU", "GANGNEUNG & MORE"];
const ROTATE_MS = 6000;

function formatCategory(raw: string): string {
  return raw
    .toLowerCase()
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function Hero() {
  const { data: posts, isLoading } = useHeroPosts(5);

  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-[1180px] px-4 py-[clamp(24px,4vw,40px)] sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 overflow-hidden rounded-[20px] border-[1.5px] border-ink lg:grid-cols-[3fr_2fr] lg:divide-x-[1.5px] lg:divide-ink">
          {/* Left: brand message */}
          <div className="border-b-[1.5px] border-ink p-[clamp(28px,4vw,48px)] lg:border-b-0">
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[12px] font-bold uppercase tracking-[0.14em] text-accent">
              <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-accent" />
              {AREAS.map((area) => (
                <span key={area}>{area}</span>
              ))}
            </div>

            <h1 className="mt-4 font-display text-[clamp(38px,6vw,72px)] font-extrabold leading-[0.98] tracking-[-0.03em] text-ink">
              KOREA,
              <br />
              every city
              <br />
              <span className="text-accent">actually</span>
              <br />
              worth it.
            </h1>

            <p className="mt-6 max-w-[46ch] text-[clamp(15px,1.6vw,18px)] leading-[1.6] text-muted">
              We help you travel deeper, city by city, with real Korea travel tips from the people who actually live here.
            </p>
          </div>

          {/* Right: Featured Read (a blog post an admin has pinned here) */}
          {isLoading ? (
            <div className="flex min-h-[280px] items-center justify-center bg-accent-light lg:min-h-full">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : posts && posts.length > 0 ? (
            <PostCarousel posts={posts} />
          ) : (
            <Link
              to="/guidebook"
              className="flex min-h-[280px] flex-col items-start justify-end bg-accent p-[clamp(24px,3vw,36px)] text-white lg:min-h-full"
            >
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.1em]">
                Featured Read
              </span>
              <h2 className="mt-4 font-display text-[22px] font-extrabold leading-[1.15]">Coming soon</h2>
              <p className="mt-1.5 text-[14px] text-white/85">New stories are being written.</p>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * The right-hand panel: the pinned post and the latest ones, one at a time,
 * crossfading every few seconds. Each slide's hero photo fills the panel with
 * the text over a gradient — not the thumbnail, whose drawn-in headline read
 * twice next to the real title.
 */
function PostCarousel({ posts }: { posts: HeroPostRow[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = posts.length;

  const go = (i: number) => setIndex(((i % count) + count) % count);

  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    // Restarts whenever the slide changes, so a dot click gets a full turn too.
    const t = setTimeout(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => clearTimeout(t);
  }, [index, paused, count]);

  return (
    <div
      className="relative min-h-[340px] overflow-hidden bg-accent text-white lg:min-h-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
      }}
    >
      {posts.map((post, i) => {
        const active = i === index;
        return (
          <Link
            key={post.slug}
            to={`/guidebook/${post.slug}`}
            aria-hidden={!active}
            tabIndex={active ? 0 : -1}
            className={`group absolute inset-0 flex flex-col justify-between p-[clamp(24px,3vw,36px)] transition-opacity duration-700 ${
              active ? "z-10 opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            {post.hero_image_url && (
              <>
                {/* The first slide is the homepage's largest paint: fetched first. */}
                <OptimizedImage
                  src={post.hero_image_url}
                  alt=""
                  preset="detail"
                  priority={i === 0}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/35 to-ink/10" />
              </>
            )}

            <span className="relative inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.1em]">
              {post.featured ? "Featured Read" : "Latest"}
            </span>

            <div className="relative pb-6">
              {post.category && (
                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/80">
                  {formatCategory(post.category)}
                </span>
              )}
              <h2 className="mt-1 font-display text-[clamp(22px,2.4vw,28px)] font-extrabold leading-[1.1]">{post.title}</h2>
              {post.excerpt && <p className="mt-2 line-clamp-2 text-[13.5px] text-white/85">{post.excerpt}</p>}
            </div>
          </Link>
        );
      })}

      {count > 1 && (
        <div className="absolute bottom-[clamp(14px,2vw,20px)] left-[clamp(24px,3vw,36px)] z-20 flex gap-1.5">
          {posts.map((post, i) => (
            <button
              key={post.slug}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show story ${i + 1} of ${count}`}
              aria-current={i === index}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
