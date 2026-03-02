import { BlogCardSkeleton } from "@/components/common/Skeleton";

interface BlogListSkeletonProps {
  count?: number;
}

export default function BlogListSkeleton({ count = 12 }: BlogListSkeletonProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <BlogCardSkeleton key={i} />
      ))}
    </div>
  );
}
