/** Shimmer placeholder — use for list/card loading states. */
export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-md bg-gray-200/90 ${className}`} aria-hidden />;
}

export function CourseCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      <Skeleton className="aspect-[4/3] w-full rounded-none rounded-t-2xl" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-4 w-[85%]" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export function CatalogGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  );
}
