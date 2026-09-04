import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, X } from "lucide-react";
import { format } from "date-fns";
import PageSEO from "@/components/common/PageSEO";
import { useBlogList, BLOG_PAGE_SIZE } from "@/hooks/useBlogList";
import { BlogListSkeleton } from "@/components/blog";
import Pagination from "@/components/product/Pagination";
import NewsletterCta from "@/components/home/NewsletterCta";
import type { BlogCategory, BlogPost } from "@/types";

const CATEGORIES: { label: string; value?: BlogCategory }[] = [
  { label: "All" },
  { label: "How-To", value: "HOW-TO" },
  { label: "Local Life", value: "LOCAL-LIFE" },
  { label: "K-Culture", value: "K-CULTURE" },
  { label: "Festival", value: "FESTIVAL" },
  { label: "Food", value: "FOOD" },
  { label: "Transport", value: "TRANSPORT" },
];

export default function GuidebookPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const category = (searchParams.get("category") as BlogCategory) || undefined;
  const search = searchParams.get("search") || "";
  const page = Number(searchParams.get("page")) || 1;
  const [searchInput, setSearchInput] = useState(search);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([key, value]) => {
          if (value) next.set(key, value);
          else next.delete(key);
        });
        if (!("page" in updates)) next.delete("page");
        return next;
      });
    },
    [setSearchParams],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) updateParams({ search: searchInput || undefined });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, search, updateParams]);

  const { data, isLoading, isPlaceholderData } = useBlogList({
    category,
    search,
    page,
    pageSize: BLOG_PAGE_SIZE,
  });

  const showFeatured = page === 1 && !search && !category;
  const posts = data?.posts ?? [];
  const featured = showFeatured ? posts[0] : undefined;
  const rest = featured ? posts.slice(1) : posts;

  return (
    <>
      <PageSEO
        title="Guidebook | Korea By Local"
        description="Korea, written by the people who actually live here — honest city guides, food, itineraries and culture from verified local hosts."
        path="/guidebook"
      />

      {/* Hero */}
      <section className="mx-auto max-w-[1180px] px-4 pb-[clamp(14px,2vw,22px)] pt-[clamp(30px,4vw,52px)] text-center sm:px-6 lg:px-8">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          The Guidebook
        </div>
        <h1 className="mt-2.5 font-display text-[clamp(34px,6vw,68px)] font-extrabold leading-[0.98] tracking-[-0.03em]">
          Local guides, tips & stories
        </h1>
        <p className="mt-3.5 font-serif-accent text-[clamp(16px,2vw,22px)] italic text-muted">
          Korea, written by the people who actually live here.
        </p>

        {/* Search */}
        <div className="relative mx-auto mt-6 flex max-w-[560px] items-center gap-2 rounded-[14px] border border-ink/12 bg-white py-1.5 pl-4 pr-1.5 shadow-[0_8px_26px_rgba(26,26,26,0.06)]">
          <Search className="h-[18px] w-[18px] text-muted-3" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search guides — city, food, season…"
            className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-ink outline-none placeholder:text-muted-3"
          />
          {searchInput && (
            <button onClick={() => setSearchInput("")} aria-label="Clear search" className="px-1 text-muted-3 hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="mt-[18px] flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((c) => {
            const on = (c.value ?? undefined) === category;
            return (
              <button
                key={c.label}
                onClick={() => updateParams({ category: c.value })}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-[13.5px] font-semibold ${
                  on ? "bg-ink text-white" : "border border-ink/10 bg-white text-muted"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className={`mx-auto max-w-[1180px] px-4 pb-[clamp(40px,6vw,80px)] pt-[clamp(16px,2.5vw,28px)] sm:px-6 lg:px-8 ${isPlaceholderData ? "opacity-60" : ""}`}>
        {isLoading ? (
          <BlogListSkeleton />
        ) : posts.length > 0 ? (
          <>
            {/* Featured editor's pick */}
            {featured && <FeaturedCard post={featured} />}

            {/* Latest grid */}
            <div className="mt-[clamp(24px,4vw,40px)] grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[18px]">
              {rest.map((post) => (
                <MagazineCard key={post.id} post={post} />
              ))}
            </div>

            <Pagination
              current={page}
              total={data?.totalPages ?? 1}
              onChange={(p) => {
                updateParams({ page: p > 1 ? String(p) : undefined });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </>
        ) : (
          <div className="py-20 text-center">
            <p className="text-lg text-muted">No guides found{search ? ` for “${search}”` : ""}.</p>
            {(search || category) && (
              <button
                onClick={() => { setSearchInput(""); setSearchParams({}); }}
                className="mt-4 text-sm font-semibold text-accent hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </section>

      <NewsletterCta />
    </>
  );
}

function FeaturedCard({ post }: { post: BlogPost }) {
  return (
    <Link
      to={`/guidebook/${post.slug}`}
      className="flex w-full flex-wrap overflow-hidden rounded-[24px] bg-ink text-left shadow-[0_18px_50px_rgba(26,26,26,0.18)]"
    >
      <div className="relative min-h-[300px] flex-[2_1_360px] overflow-hidden bg-[#222]">
        <div
          role="img"
          aria-label={post.title}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${post.thumbnail_url ?? ""})` }}
        />
        <span className="absolute left-[18px] top-[18px] rounded-[7px] bg-gold px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.06em] text-ink">
          ★ Editor’s pick · {post.category}
        </span>
      </div>
      <div className="flex flex-[1_1_300px] flex-col justify-center p-[clamp(26px,3.5vw,48px)] text-white">
        <h2 className="font-display text-[clamp(24px,3.2vw,40px)] font-extrabold leading-[1.05] tracking-[-0.02em]">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="mt-3.5 max-w-[46ch] text-[15px] leading-[1.6] text-white/75">{post.excerpt}</p>
        )}
        <div className="mt-4 text-[13.5px] text-white/60">
          {post.author ?? "Korea by Local"}
          {post.published_at && <> · {format(new Date(post.published_at), "MMM yyyy")}</>}
        </div>
        <span className="mt-[18px] inline-flex w-fit rounded-[11px] bg-white px-5 py-2.5 text-[13.5px] font-bold text-ink">
          Read the guide →
        </span>
      </div>
    </Link>
  );
}

function MagazineCard({ post }: { post: BlogPost }) {
  return (
    <Link
      to={`/guidebook/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_8px_26px_rgba(26,26,26,0.08)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_44px_rgba(26,26,26,0.16)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-cream-200">
        <div
          role="img"
          aria-label={post.title}
          className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url(${post.thumbnail_url ?? ""})` }}
        />
        <span className="absolute left-3 top-3 rounded-[7px] bg-ink/80 px-2.5 py-[5px] text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-white">
          {post.category}
        </span>
      </div>
      <div className="p-[17px]">
        <h3 className="font-display text-[17.5px] font-bold leading-[1.24] text-ink">{post.title}</h3>
        <div className="mt-2.5 text-[12px] text-muted-2">
          {post.author ?? "Korea by Local"}
          {post.published_at && <> · {format(new Date(post.published_at), "MMM d, yyyy")}</>}
        </div>
      </div>
    </Link>
  );
}
