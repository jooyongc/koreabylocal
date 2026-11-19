export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

export function BlogCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}
