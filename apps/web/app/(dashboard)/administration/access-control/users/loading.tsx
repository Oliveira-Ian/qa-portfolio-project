import { LoadingState } from '@/components/ui/loading-state';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Shown while the accounts list is being read. Mirrors People's own
 * `loading.tsx` — header, rule, then rows — so the page settles into place
 * instead of jumping once the data arrives.
 */
export default function UsersLoading() {
  return (
    <div aria-busy="true" aria-label="Loading users">
      <div className="mb-6">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-2 h-8 w-24" />
        <Skeleton className="mt-2 h-4 w-72" />
        <div className="measured-rule mt-5" aria-hidden="true" />
      </div>

      <LoadingState rows={6} columns={5} showCheckbox={false} />
    </div>
  );
}
