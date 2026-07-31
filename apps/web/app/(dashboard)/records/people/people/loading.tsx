import { LoadingState } from '@/components/ui/loading-state';
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

      <LoadingState rows={6} columns={4} />
    </div>
  );
}
