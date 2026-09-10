import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useFeaturedBlogPost } from "@/hooks/useConcepts";

const AREAS = ["SEOUL", "BUSAN", "JEJU", "GANGNEUNG & MORE"];

function formatCategory(raw: string): string {
  return raw
    .toLowerCase()
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function Hero() {
  const { data: post, isLoading } = useFeaturedBlogPost();
  const image = post?.thumbnail_url ?? post?.hero_image_url ?? undefined;

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
              From hidden alleys to local favorites — we help you travel deeper, city by city.
            </p>
          </div>

          {/* Right: Featured Read (a blog post an admin has pinned here) */}
          {isLoading ? (
            <div className="flex min-h-[280px] items-center justify-center bg-accent-light lg:min-h-full">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : post ? (
            <Link
              to={`/guidebook/${post.slug}`}
              className="group relative flex min-h-[280px] flex-col justify-end overflow-hidden bg-accent p-[clamp(24px,3vw,36px)] text-white lg:min-h-full"
            >
              {image && (
                <img
                  src={image}
                  alt={post.title}
                  className="absolute inset-0 h-full w-full object-cover opacity-45 transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />

              <span className="relative mb-auto inline-flex w-fit items-center gap-1.5 rounded-full border border-white/50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.1em]">
                Featured Read
              </span>

              <div className="relative">
                {post.category && (
                  <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/75">
                    {formatCategory(post.category)}
                  </span>
                )}
                <h2 className="mt-1 font-display text-[24px] font-extrabold leading-[1.1]">{post.title}</h2>
                {post.excerpt && <p className="mt-1.5 line-clamp-2 text-[14px] text-white/85">{post.excerpt}</p>}
              </div>
            </Link>
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
