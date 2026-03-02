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
    <section className="mt-16">
      <h2 className="mb-6 text-xl font-bold text-primary">Related Posts</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogListCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
