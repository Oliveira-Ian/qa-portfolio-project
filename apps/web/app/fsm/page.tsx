import type { Metadata } from 'next';
import Link from 'next/link';
import {
  AlarmClock,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  CirclePause,
  CirclePlay,
  ClipboardList,
  Plus,
} from 'lucide-react';
import { WorkOrderSummaryList } from '@/components/fsm/work-order-summary-list';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { getLocale, getTranslator } from '@/lib/i18n/server';
import { filterCatalogForAccount, flattenRoutines } from '@/lib/navigation/catalog';
import { ROUTES } from '@/lib/navigation/routes';
import { can, getMe } from '@/lib/permissions';
import { getFsmDashboard } from './_data-access/get-dashboard';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: `${t('fsm.home.title')} · Oliveira FSM` };
}

/**
 * Oliveira FSM's home. With `dashboard:view`: the operation at a glance —
 * counts by status that open the list already filtered, what is overdue,
 * scheduled today and done this month, what comes next and what was opened
 * last; a technician sees their own work. Below, or alone without the
 * permission, the screens this member can open.
 */
export default async function FsmHomePage() {
  const [t, locale, me, canSeeDashboard, canCreate] = await Promise.all([
    getTranslator(),
    getLocale(),
    getMe(),
    can('FSM', 'dashboard:view'),
    can('FSM', 'work-order:create'),
  ]);
  const modules = filterCatalogForAccount('FSM', me.permissions.FSM);
  const dashboard = canSeeDashboard ? await getFsmDashboard() : null;
  const listHref =
    dashboard?.scope === 'mine' ? ROUTES.fsm.myWorkOrders : ROUTES.fsm.workOrders.list;
  const byStatus = (status: string) => `${listHref}?f_status=${status}`;

  return (
    <div data-testid="fsm-home">
      <PageHeader
        title={t('fsm.home.title')}
        titleTestId="fsm-home-title"
        description={t(dashboard?.scope === 'mine' ? 'fsm.home.leadMine' : 'fsm.home.lead')}
        {...(canCreate
          ? {
              actions: (
                <Button asChild data-testid="fsm-home-new-work-order">
                  <Link href={ROUTES.fsm.workOrders.new}>
                    <Plus aria-hidden="true" />
                    {t('fsm.workOrders.list.add')}
                  </Link>
                </Button>
              ),
            }
          : {})}
      />

      {dashboard ? (
        <div className="mb-10 grid gap-8" data-testid="fsm-dashboard">
          <div className="grid gap-4">
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-4">
              <StatCard
                label={t('fsm.home.stats.open')}
                value={dashboard.byStatus.OPEN}
                icon={ClipboardList}
                locale={locale}
                href={byStatus('OPEN')}
                data-testid="fsm-stat-open"
              />
              <StatCard
                label={t('fsm.home.stats.scheduled')}
                value={dashboard.byStatus.SCHEDULED}
                icon={CalendarClock}
                locale={locale}
                href={byStatus('SCHEDULED')}
                data-testid="fsm-stat-scheduled"
              />
              <StatCard
                label={t('fsm.home.stats.inProgress')}
                value={dashboard.byStatus.IN_PROGRESS}
                icon={CirclePlay}
                locale={locale}
                href={byStatus('IN_PROGRESS')}
                data-testid="fsm-stat-in-progress"
              />
              <StatCard
                label={t('fsm.home.stats.onHold')}
                value={dashboard.byStatus.ON_HOLD}
                icon={CirclePause}
                locale={locale}
                href={byStatus('ON_HOLD')}
                data-testid="fsm-stat-on-hold"
              />
            </dl>
            <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
              <StatCard
                label={t('fsm.home.stats.overdue')}
                value={dashboard.overdue}
                icon={AlarmClock}
                locale={locale}
                isAlert
                data-testid="fsm-stat-overdue"
              />
              <StatCard
                label={t('fsm.home.stats.today')}
                value={dashboard.scheduledToday}
                icon={CalendarCheck}
                locale={locale}
                data-testid="fsm-stat-today"
              />
              <StatCard
                label={t('fsm.home.stats.completed')}
                value={dashboard.completedLast30Days}
                icon={CheckCircle2}
                locale={locale}
                href={byStatus('COMPLETED')}
                data-testid="fsm-stat-completed"
              />
            </dl>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <section aria-labelledby="fsm-home-upcoming">
              <div className="mb-3 flex items-end justify-between gap-4">
                <h2 id="fsm-home-upcoming">{t('fsm.home.upcoming')}</h2>
              </div>
              <WorkOrderSummaryList
                workOrders={dashboard.upcoming}
                emptyText={t('fsm.home.noUpcoming')}
                testId="fsm-home-upcoming"
              />
            </section>
            <section aria-labelledby="fsm-home-recent">
              <div className="mb-3 flex items-end justify-between gap-4">
                <h2 id="fsm-home-recent">{t('fsm.home.recent')}</h2>
                <Link
                  href={listHref}
                  className="rounded-xs text-sm font-semibold text-foreground underline underline-offset-3 focus-visible:ring-focus"
                  data-testid="fsm-home-see-all"
                >
                  {t('fsm.home.seeAll')}
                </Link>
              </div>
              <WorkOrderSummaryList
                workOrders={dashboard.recent}
                emptyText={t('fsm.home.noRecent')}
                testId="fsm-home-recent"
              />
            </section>
          </div>
        </div>
      ) : null}

      <div className="grid gap-8">
        {dashboard ? <h2 className="-mb-4">{t('fsm.home.shortcuts')}</h2> : null}
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
