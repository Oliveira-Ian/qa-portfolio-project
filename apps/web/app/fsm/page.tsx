import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { getTranslator } from '@/lib/i18n/server';
import { filterCatalogForAccount, flattenRoutines } from '@/lib/navigation/catalog';
import { getMe } from '@/lib/permissions';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: `${t('fsm.home.title')} · Oliveira FSM` };
}

/**
 * Oliveira FSM's home: for now, the screens this member can open, grouped
 * like the sidebar. The operations dashboard (plan § 2.5) takes this place
 * once work orders exist.
 */
export default async function FsmHomePage() {
  const [t, me] = await Promise.all([getTranslator(), getMe()]);
  const modules = filterCatalogForAccount('FSM', me.permissions.FSM);

  return (
    <div data-testid="fsm-home">
      <PageHeader
        title={t('fsm.home.title')}
        titleTestId="fsm-home-title"
        description={t('fsm.home.lead')}
      />

      <div className="grid gap-8">
        {modules.map((catalogModule) => (
          <section key={catalogModule.slug} aria-labelledby={`fsm-home-${catalogModule.slug}`}>
            <h2 id={`fsm-home-${catalogModule.slug}`} className="olv-overline mb-3 text-text-3">
              {t(catalogModule.labelKey)}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {flattenRoutines('FSM', [catalogModule]).map((entry) => {
                const Icon = entry.routine.icon;

                return (
                  <Link
                    key={entry.href}
                    href={entry.href}
                    data-testid={`fsm-home-link-${entry.routine.slug}`}
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-button-hover hover:bg-surface-2 focus-visible:ring-focus"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent-50 text-accent-600">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="font-medium">{t(entry.routine.labelKey)}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
