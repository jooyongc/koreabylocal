import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, Eye, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { useBlogPost } from "@/hooks/useBlogPost";
import { useAdjacentBlogPosts } from "@/hooks/useAdjacentBlogPosts";
import {
  BlogContent,
  ShareButtons,
  PostNavigation,
  RelatedBlogPosts,
} from "@/components/blog";
import { Skeleton } from "@/components/common/Skeleton";
import { supabase } from "@/lib/supabase";

const CATEGORY_COLORS: Record<string, string> = {
  NEWS: "bg-blue-100 text-blue-700",
  LOCALS: "bg-emerald-100 text-emerald-700",
  KOREAN: "bg-orange-100 text-orange-700",
  "K-CULTURE": "bg-purple-100 text-purple-700",
};

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading } = useBlogPost(slug);
  const { data: adjacent } = useAdjacentBlogPosts(
    post?.published_at,
    post?.id
  );

  // Increment view count
  useEffect(() => {
    if (!post?.id) return;
    supabase.functions
      .invoke("increment-view", {
        body: { type: "blog", id: post.id },
      })
      .catch(() => {});
  }, [post?.id]);

  // Loading
  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Skeleton className="mb-4 h-4 w-48" />
        <Skeleton className="mb-2 h-10 w-full" />
        <Skeleton className="mb-8 h-10 w-3/4" />
        <Skeleton className="aspect-[16/9] w-full rounded-xl" />
        <div className="mt-8 space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    );
  }

  // Not found
  if (!post) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-primary">Post not found</h1>
        <p className="mt-2 text-text-secondary">
          The blog post you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          to="/blog"
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
        >
          Back to Blog
        </Link>
      </div>
    );
  }

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seo_description ?? post.excerpt ?? "",
    image: post.thumbnail_url ?? undefined,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: post.author
      ? { "@type": "Person", name: post.author }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: "Korea By Local",
    },
  };

  return (
    <>
      <Helmet>
        <title>
          {post.seo_title ?? post.title} | Korea By Local
        </title>
        <meta
          name="description"
          content={post.seo_description ?? post.excerpt ?? ""}
        />
        <meta property="og:title" content={post.seo_title ?? post.title} />
        <meta
          property="og:description"
          content={post.seo_description ?? post.excerpt ?? ""}
        />
        {post.thumbnail_url && (
          <meta property="og:image" content={post.thumbnail_url} />
        )}
        <meta property="og:type" content="article" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <article className="mx-auto max-w-4xl px-4 py-6 lg:py-10">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-text-secondary">
          <Link to="/" className="hover:text-primary">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/blog" className="hover:text-primary">
            Blog
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="truncate text-primary">{post.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          {/* Category badge */}
          <span
            className={`inline-block rounded px-2.5 py-1 text-xs font-bold uppercase ${CATEGORY_COLORS[post.category] ?? "bg-gray-100 text-gray-700"}`}
          >
            {post.category}
          </span>

          <h1 className="mt-4 text-3xl font-bold leading-tight text-primary lg:text-4xl">
            {post.title}
          </h1>

          {/* Meta info */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-text-secondary">
            {post.author && (
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {post.author}
              </span>
            )}
            {post.published_at && (
              <time className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {format(new Date(post.published_at), "MMMM d, yyyy")}
              </time>
            )}
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {post.view_count.toLocaleString()} views
            </span>
          </div>
        </header>

        {/* Featured image */}
        {post.thumbnail_url && (
          <div className="mb-10 overflow-hidden rounded-xl">
            <img
              src={post.thumbnail_url}
              alt={post.title}
              className="w-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        {post.content && <BlogContent html={post.content} />}

        {/* Share buttons */}
        <div className="mt-12 flex items-center justify-between border-t border-gray-200 pt-6">
          <ShareButtons
            url={pageUrl}
            title={post.title}
            description={post.seo_description ?? post.excerpt ?? ""}
            imageUrl={post.thumbnail_url ?? undefined}
          />
        </div>

        {/* Prev / Next navigation */}
        <PostNavigation
          prev={adjacent?.prev ?? null}
          next={adjacent?.next ?? null}
        />

        {/* Related posts */}
        <RelatedBlogPosts category={post.category} excludeId={post.id} />
      </article>
    </>
  );
}
