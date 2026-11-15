import { Skeleton } from '@/components/ui/skeleton';
import { getTranslator } from '@/lib/i18n/server';

/**
 * Shown while a record (view, new or edit) is loading. It mirrors the record's
 * layout — header, then a card of sections with a label column and fields —
 * so the page settles into place instead of showing a list's table skeleton
 * first (a `loading.tsx` applies to every route below it).
 */
export async function RecordLoading() {
  const t = await getTranslator();

  return (
    <div className="max-w-[60rem]" aria-busy="true" aria-label={t('table.loading')}>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-2 h-3 w-32" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="divide-y divide-border rounded-xl border border-border bg-surface">
        {[0, 1].map((section) => (
          <div key={section} className="grid gap-6 px-6 py-7 md:grid-cols-[13rem_minmax(0,1fr)]">
            <div>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-2 h-3 w-40" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {[0, 1, 2, 3].map((field) => (
                <div key={field} className="grid gap-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
