import { Skeleton } from '@/components/ui/skeleton';

/**
 * Shown while the registry is being read. It mirrors the real layout — header,
 * rule, then rows — so the page settles into place instead of jumping.
 */
export default function PeopleLoading() {
  return (
    <div aria-busy="true" aria-label="Loading people">
      <div className="mb-6">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-2 h-8 w-40" />
        <div className="measured-rule mt-5" aria-hidden="true" />
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 border-b border-border px-4 py-4">
            <Skeleton className="size-4 shrink-0" />
            <Skeleton className="h-4 w-16 shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20 shrink-0" />
            <Skeleton className="h-4 w-28 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
