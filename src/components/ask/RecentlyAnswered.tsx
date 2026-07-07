import { Link } from "react-router-dom";
import { useBlogPosts } from "@/hooks/useBlogPosts";

/** Real answered questions — pulled from the blog (canonical home) and linked out. */
export default function RecentlyAnswered() {
  const { data: posts } = useBlogPosts(undefined, 6);
  if (!posts || posts.length === 0) return null;

  return (
    <section
      aria-labelledby="recently-answered-heading"
      className="mx-auto max-w-[1020px] px-4 pb-[clamp(48px,7vw,90px)] pt-[clamp(34px,5vw,64px)] sm:px-6 lg:px-8"
    >
      <h2
        id="recently-answered-heading"
        className="mb-6 text-center font-display text-[clamp(22px,3vw,32px)] font-extrabold tracking-[-0.01em] text-ink"
      >
        Recently answered
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            to={`/blog/${post.slug}`}
            className="group flex flex-col rounded-[18px] bg-white p-[22px] shadow-[0_8px_26px_rgba(16,15,44,0.07)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(16,15,44,0.14)]"
          >
            <h3 className="font-display text-[16px] font-bold leading-[1.3] text-ink group-hover:text-accent">
              {post.title}
            </h3>
            <p className="my-3 mb-3.5 line-clamp-3 text-[14px] leading-[1.6] text-[#3a3730]">
              {post.excerpt}
            </p>
            <p className="mt-auto text-[12px] font-semibold text-accent">
              ✦ Answered by {post.author || "Korea by Local"}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
