import { LoadingState } from '@/components/ui/loading-state';
import { Skeleton } from '@/components/ui/skeleton';
import { getTranslator } from '@/lib/i18n/server';

/**
 * Shown while the registry is being read. It mirrors the real layout — header,
 * tabs, then rows — so the page settles into place instead of jumping.
 */
export default async function PeopleLoading() {
  const t = await getTranslator();

  return (
    <div aria-busy="true" aria-label={t('table.loading')}>
      <div className="mb-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-3 w-24" />
      </div>
      <Skeleton className="mb-5 h-10 w-72" />

      <LoadingState rows={6} columns={4} label={t('table.loading')} />
    </div>
  );
}
