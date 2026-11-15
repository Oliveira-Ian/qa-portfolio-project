import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { getTranslator } from '@/lib/i18n/server';
import { filterCatalogForAccount, flattenRoutines } from '@/lib/navigation/catalog';
import { ROUTES } from '@/lib/navigation/routes';
import { can, getMe } from '@/lib/permissions';
import { OperationsOverview } from './_components/operations-overview';
import { getFsmDashboard } from './_data-access/get-dashboard';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: `${t('fsm.home.title')} · Oliveira FSM` };
}

/**
 * Oliveira FSM's home. With `dashboard:view`: the operations overview (board
 * FSM-03) — every work order, or a technician's own. Without it, the screens
 * this member can open, as shortcuts (the menu already lists them for
 * everyone else, so the dashboard doesn't repeat them).
 */
export default async function FsmHomePage() {
  const [t, me, canSeeDashboard, canCreate] = await Promise.all([
    getTranslator(),
    getMe(),
    can('FSM', 'dashboard:view'),
    can('FSM', 'work-order:create'),
  ]);

  if (canSeeDashboard) {
    return (
      <div data-testid="fsm-home">
        <OperationsOverview
          dashboard={await getFsmDashboard()}
          now={new Date().toISOString()}
          canCreate={canCreate}
        />
      </div>
    );
  }

  const modules = filterCatalogForAccount('FSM', me.permissions.FSM);

  return (
    <div data-testid="fsm-home">
      <PageHeader
        title={t('fsm.home.title')}
        titleTestId="fsm-home-title"
        description={t('fsm.home.lead')}
        {...(canCreate
          ? {
              actions: (
                <Button asChild variant="create" data-testid="fsm-home-new-work-order">
                  <Link href={ROUTES.fsm.workOrders.new}>
                    <Plus aria-hidden="true" />
                    {t('fsm.workOrders.list.add')}
                  </Link>
                </Button>
              ),
            }
          : {})}
      />
      <div className="grid gap-8">
        {modules.map((catalogModule) => (
          <section key={catalogModule.slug} aria-labelledby={`fsm-home-${catalogModule.slug}`}>
            <h3 id={`fsm-home-${catalogModule.slug}`} className="olv-overline mb-3 text-text-3">
              {t(catalogModule.labelKey)}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {flattenRoutines('FSM', [catalogModule]).map((entry) => {
                const Icon = entry.routine.icon;

                return (
                  <Link
                    key={entry.href}
                    href={entry.href}
                    data-testid={`fsm-home-link-${entry.routine.slug}`}
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 shadow-fsm-card transition-colors hover:border-border-button focus-visible:ring-focus"
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
