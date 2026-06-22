import { useRelatedBlogPosts } from "@/hooks/useRelatedBlogPosts";
import BlogListCard from "./BlogListCard";

interface RelatedBlogPostsProps {
  category: string;
  excludeId: number;
}

export default function RelatedBlogPosts({
  category,
  excludeId,
}: RelatedBlogPostsProps) {
  const { data: posts, isLoading } = useRelatedBlogPosts(category, excludeId);

  if (isLoading || !posts || posts.length === 0) return null;

  return (
    <section className="mt-4">
      <h2 className="mb-6 font-display text-[clamp(22px,3vw,32px)] font-extrabold tracking-[-0.02em] text-ink">
        Keep reading
      </h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[18px]">
        {posts.map((post) => (
          <BlogListCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
