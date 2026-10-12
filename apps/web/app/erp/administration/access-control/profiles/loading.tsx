import { LoadingState } from '@/components/ui/loading-state';
import { Skeleton } from '@/components/ui/skeleton';
import { getTranslator } from '@/lib/i18n/server';

/**
 * Shown while the profile catalog is being read. Mirrors People's own
 * `loading.tsx` — header, then rows — so the page settles into place instead of
 * jumping once the data arrives.
 */
export default async function ProfilesLoading() {
  const t = await getTranslator();

  return (
    <div aria-busy="true" aria-label={t('table.loading')}>
      <div className="mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-3 w-24" />
      </div>

      <LoadingState rows={5} columns={4} label={t('table.loading')} />
    </div>
  );
}
