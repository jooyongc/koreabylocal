import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Share2, Heart, Bookmark, BadgeCheck, ChevronRight, MessageCircle, BookOpen } from "lucide-react";
import { format } from "date-fns";
import PageSEO, { SITE_URL } from "@/components/common/PageSEO";
import { useBlogPost } from "@/hooks/useBlogPost";
import { BlogContent, ShareButtons, RelatedBlogPosts, PostNavigation } from "@/components/blog";
import { Skeleton } from "@/components/common/Skeleton";
import { supabase } from "@/lib/supabase";
import { useRegions, useExperiences } from "@/hooks/useConcepts";
import SpotCard from "@/components/home/SpotCard";
import type { BlogPost } from "@/types";

interface TocItem { id: string; text: string; level: number }

function readingTime(html: string | null): number {
  if (!html) return 1;
  const words = html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default function GuideDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading } = useBlogPost(slug);
  const articleRef = useRef<HTMLDivElement>(null);
  const [toc, setToc] = useState<TocItem[]>([]);

  const minutes = useMemo(() => readingTime(post?.content ?? null), [post?.content]);

  // Increment view count (best-effort)
  useEffect(() => {
    if (!post?.id) return;
    supabase.functions
      .invoke("increment-view-count", { body: { type: "blog", id: post.id } })
      .catch(() => {});
  }, [post?.id]);

  // Build a "In this story" table of contents from the rendered headings.
  useEffect(() => {
    if (!post || !articleRef.current) return;
    const headings = Array.from(
      articleRef.current.querySelectorAll<HTMLHeadingElement>("h2"),
    );
    const items: TocItem[] = headings.map((h, i) => {
      const text = (h.textContent ?? "").trim();
      const id =
        h.id ||
        `sec-${i}-${text.toLowerCase().replace(/[^\w]+/g, "-").slice(0, 40)}`;
      h.id = id;
      return { id, text, level: 2 };
    });
    setToc(items.filter((it) => it.text));
  }, [post]);

  // Best-effort: find a region this guide is about (title/excerpt/category match),
  // then surface a few spots there. No formal region↔post linkage exists yet.
  const { data: regions } = useRegions();
  const matchedRegion = useMemo(() => {
    if (!post || !regions) return undefined;
    const haystack = `${post.title} ${post.excerpt ?? ""} ${post.category}`.toLowerCase();
    return regions.find((r) => haystack.includes(r.name.toLowerCase()));
  }, [post, regions]);
  const { data: relatedSpots } = useExperiences({ region: matchedRegion?.key, limit: 3 });

  // Previous/next published guide, ordered by publish date.
  const { data: adjacent } = useQuery({
    queryKey: ["adjacent-guide", post?.id, post?.published_at],
    enabled: !!post?.published_at,
    queryFn: async (): Promise<{ prev: BlogPost | null; next: BlogPost | null }> => {
      const [{ data: prev }, { data: next }] = await Promise.all([
        supabase
          .from("blog_posts")
          .select("*")
          .eq("status", "published")
          .lt("published_at", post!.published_at!)
          .order("published_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("blog_posts")
          .select("*")
          .eq("status", "published")
          .gt("published_at", post!.published_at!)
          .order("published_at", { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);
      return { prev: prev as BlogPost | null, next: next as BlogPost | null };
    },
  });

  const scrollToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `#${id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[760px] px-4 py-12 sm:px-6">
        <Skeleton className="mb-4 h-4 w-48" />
        <Skeleton className="mb-2 h-12 w-full" />
        <Skeleton className="mb-8 h-12 w-3/4" />
        <Skeleton className="aspect-[16/8] w-full rounded-2xl" />
        <div className="mt-8 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-[760px] px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-extrabold text-ink">Story not found</h1>
        <p className="mt-2 text-muted">This guide doesn’t exist or was moved.</p>
        <Link
          to="/guidebook"
          className="mt-6 inline-block rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-white"
        >
          Back to the Guidebook
        </Link>
      </div>
    );
  }

  const pageTitle = `${post.seo_title ?? post.title} | Korea By Local`;
  const pageDesc = post.seo_description ?? post.excerpt ?? "";
  const pagePath = `/guidebook/${post.slug}`;
  const pageUrl = `${SITE_URL}${pagePath}`;
  const author = post.author ?? "Korea by Local";

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: pageDesc,
    image: post.thumbnail_url ?? undefined,
    url: pageUrl,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { "@type": "Organization", name: author },
    publisher: { "@type": "Organization", name: "Korea By Local", url: SITE_URL },
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Guidebook", item: `${SITE_URL}/guidebook` },
      { "@type": "ListItem", position: 3, name: post.title },
    ],
  };

  const heroImage = post.hero_image_url ?? post.thumbnail_url;
  const faqs = Array.isArray(post.faqs) ? (post.faqs as { q: string; a: string }[]) : [];
  const faqSchema = faqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }
    : null;

  return (
    <>
      <PageSEO
        title={pageTitle}
        description={pageDesc}
        path={pagePath}
        ogImage={heroImage ?? undefined}
        ogType="article"
        jsonLd={[articleSchema, breadcrumbSchema, ...(faqSchema ? [faqSchema] : [])]}
      />

      {/* Header */}
      <section className="mx-auto max-w-[760px] px-4 pb-[clamp(12px,2vw,20px)] pt-[clamp(24px,3.5vw,44px)] sm:px-6">
        <nav className="mb-4 flex items-center gap-1.5 text-[12.5px] text-muted-2">
          <Link to="/" className="hover:text-ink">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/guidebook" className="hover:text-ink">Guidebook</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="truncate text-ink">{post.title}</span>
        </nav>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="rounded-[7px] bg-accent px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.06em] text-white">
            {post.category}
          </span>
          <span className="text-[13px] text-muted-2">
            ⏱ {minutes} min read
            {post.published_at && <> · {format(new Date(post.published_at), "MMM yyyy")}</>}
          </span>
        </div>
        <h1 className="mt-4 font-display text-[clamp(30px,5vw,52px)] font-extrabold leading-[1.04] tracking-[-0.02em] text-ink">
          {post.title}
        </h1>

        {/* Author + actions */}
        <div className="mt-[22px] flex flex-wrap items-center justify-between gap-3.5 border-b border-ink/10 pb-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-ink font-display text-[18px] font-extrabold text-white">
              {author.charAt(0)}
            </span>
            <div>
              <div className="text-[14.5px] font-bold text-ink">{author}</div>
              <div className="flex items-center gap-1 text-[12.5px] text-muted-2">
                <BadgeCheck className="h-3.5 w-3.5 text-green" /> Korea by Local · Verified
              </div>
            </div>
          </div>
          <ShareButtons
            url={pageUrl}
            title={post.title}
            description={pageDesc}
            imageUrl={post.thumbnail_url ?? undefined}
          />
        </div>
      </section>

      {/* Hero image — a topic-relevant image (not the list thumbnail) */}
      {heroImage && (
        <section className="mx-auto max-w-[1000px] px-4 sm:px-6">
          <div
            role="img"
            aria-label={post.title}
            className="aspect-[16/8] rounded-[20px] bg-cover bg-center shadow-[0_14px_40px_rgba(26,26,26,0.14)]"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
        </section>
      )}

      {/* Body + sidebar */}
      <section className="mx-auto grid max-w-[1180px] grid-cols-1 gap-[clamp(24px,4vw,48px)] px-4 pb-[clamp(40px,6vw,80px)] pt-[clamp(26px,4vw,48px)] sm:px-6 lg:grid-cols-[1fr_300px] lg:px-8">
        <article ref={articleRef} className="kbl-article mx-auto w-full max-w-[680px] min-w-0 lg:mx-0">
          {post.content && <BlogContent html={post.content} />}

          {/* Author bio */}
          <div className="mt-9 flex flex-wrap items-center gap-4 rounded-[20px] bg-ink p-[22px] text-white">
            <span className="flex h-16 w-16 flex-none items-center justify-center rounded-full bg-white/10 font-display text-[24px] font-extrabold">
              {author.charAt(0)}
            </span>
            <div className="flex-1 basis-[200px]">
              <div className="font-display text-[18px] font-bold">Written by {author}</div>
              <p className="mt-1.5 text-[13.5px] leading-[1.55] text-white/75">
                Stories from people who actually live here — reviewed and fact-checked
                before publishing.
              </p>
            </div>
            <Link
              to="/ask-a-local"
              className="flex-none rounded-xl bg-white/12 px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-white/20"
            >
              Ask a Local
            </Link>
          </div>

          {/* Share (mobile-friendly footer) */}
          <div className="mt-8 flex items-center gap-3 text-muted-2">
            <Share2 className="h-4 w-4" />
            <Heart className="h-4 w-4" />
            <Bookmark className="h-4 w-4" />
            <span className="text-[12.5px]">Share this guide</span>
          </div>

          <PostNavigation prev={adjacent?.prev ?? null} next={adjacent?.next ?? null} />
        </article>

        {/* Sidebar */}
        <aside className="flex flex-col gap-7 lg:sticky lg:top-24 lg:self-start">
          {toc.length > 1 && (
            <div>
              <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-3">
                In this story
              </div>
              <div className="flex flex-col gap-0.5">
                {toc.map((t) => (
                  <a
                    key={t.id}
                    href={`#${t.id}`}
                    onClick={(e) => scrollToSection(e, t.id)}
                    className="block border-l-2 border-ink/12 py-[7px] pl-3 text-left text-[13.5px] text-muted transition-colors hover:border-accent hover:text-ink"
                  >
                    {t.text}
                  </a>
                ))}
              </div>
            </div>
          )}

          {relatedSpots && relatedSpots.length > 0 && (
            <div>
              <h3 className="font-display text-[15px] font-extrabold text-ink">
                Spots in {matchedRegion?.name}
              </h3>
              <div className="mt-3 flex flex-col gap-3">
                {relatedSpots.map((spot) => (
                  <SpotCard key={spot.id} spot={spot} />
                ))}
              </div>
            </div>
          )}

          <Link
            to="/ebook"
            className="flex items-center gap-3 rounded-2xl bg-accent-light p-4 text-accent-dark transition-colors hover:bg-accent-light/70"
          >
            <BookOpen className="h-5 w-5 shrink-0" />
            <div>
              <div className="text-[13.5px] font-bold">Want the full guide?</div>
              <div className="text-[12px]">It's in the e-book →</div>
            </div>
          </Link>

          <Link
            to="/about"
            className="flex items-center gap-3 rounded-2xl bg-ink p-4 text-white transition-opacity hover:opacity-90"
          >
            <MessageCircle className="h-5 w-5 shrink-0 text-accent" />
            <div>
              <div className="text-[13.5px] font-bold">Need more like this?</div>
              <div className="text-[12px] text-white/70">Chat with a real local →</div>
            </div>
          </Link>
        </aside>
      </section>

      {/* Keep reading */}
      <div className="mx-auto max-w-[1180px] px-4 pb-[clamp(48px,7vw,90px)] sm:px-6 lg:px-8">
        <RelatedBlogPosts category={post.category} excludeId={post.id} />
      </div>
    </>
  );
}
