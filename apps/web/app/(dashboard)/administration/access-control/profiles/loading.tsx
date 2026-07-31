import { LoadingState } from '@/components/ui/loading-state';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Shown while the profile catalog is being read. Mirrors People's own
 * `loading.tsx` — header, rule, then rows — so the page settles into place
 * instead of jumping once the data arrives.
 */
export default function ProfilesLoading() {
  return (
    <div aria-busy="true" aria-label="Loading profiles">
      <div className="mb-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-2 h-8 w-32" />
        <div className="measured-rule mt-5" aria-hidden="true" />
      </div>

      <LoadingState rows={5} columns={4} />
    </div>
  );
}
