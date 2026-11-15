import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageHeader } from '@/components/layout/page-header';
import { PersonTypeBadges } from '@/components/people/person-badges';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { formatDateMedium } from '@/lib/format';
import { getLocale, getTranslator } from '@/lib/i18n/server';
import { ROUTES } from '@/lib/navigation/routes';
import { can } from '@/lib/permissions';
import { getSessionAccount } from '@/lib/session';
import { getRegistrySummary } from './_data-access/get-registry-summary';
import { PersonTypeBreakdownChart } from './_components/person-type-breakdown-chart';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: t('nav.erp.overview') };
}

/**
 * The ERP's overview. The registry summary is People's data, so without the
 * View permission for People there is nothing here to summarise: the greeting
 * stays, and a line says why — it is not an error, and the menu still lists
 * whatever the profile can open.
 */
export default async function ErpOverviewPage() {
  const [t, locale, account, canViewPeople] = await Promise.all([
    getTranslator(),
    getLocale(),
    getSessionAccount(),
    can('person:view'),
  ]);

  const firstName = account?.name.trim().split(' ')[0] ?? '';
  const header = (
    <PageHeader
      title={t('erp.home.greeting', { name: firstName })}
      description={t('erp.home.lead')}
      titleTestId="home-page-title"
      actions={
        canViewPeople ? (
          <Button asChild data-testid="home-button-people">
            <Link href={ROUTES.people.list}>
              {t('erp.home.openRegistry')}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        ) : null
      }
    />
  );

  if (!canViewPeople) {
    return (
      <div data-testid="home-page">
        {header}
        <Alert variant="info" data-testid="home-limited">
          <AlertDescription>{t('erp.home.limited')}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const summary = await getRegistrySummary();

  const stats = [
    { label: t('erp.home.stats.records'), value: summary.total },
    { label: t('erp.home.stats.clients'), value: summary.clients },
    { label: t('erp.home.stats.suppliers'), value: summary.suppliers },
    { label: t('erp.home.stats.inactive'), value: summary.inactive },
  ];

  return (
    <div data-testid="home-page">
      {header}

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} locale={locale} />
        ))}
      </dl>

      <section className="mt-8" aria-labelledby="breakdown-heading">
        <h2 id="breakdown-heading" className="mb-4">
          {t('erp.home.byType')}
        </h2>
        <div className="rounded-xl border border-border bg-surface p-5">
          <PersonTypeBreakdownChart
            clients={summary.clients}
            suppliers={summary.suppliers}
            inactive={summary.inactive}
          />
        </div>
      </section>

      <section className="mt-8" aria-labelledby="recent-records-heading">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 id="recent-records-heading">{t('erp.home.latest')}</h2>
          <Link
            href={ROUTES.people.list}
            className="rounded-xs text-sm font-semibold text-foreground underline underline-offset-3 focus-visible:ring-focus"
            data-testid="home-link-all-people"
          >
            {t('erp.home.seeAll')}
          </Link>
        </div>

        {summary.recent.length > 0 ? (
          <ul className="divide-y divide-divider overflow-hidden rounded-xl border border-border bg-surface">
            {summary.recent.map((person) => (
              <li key={person.id}>
                <Link
                  href={ROUTES.people.view(person.id)}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-hover focus-visible:ring-focus focus-visible:-outline-offset-2"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {person.name}
                  </span>
                  <span className="olv-data tabular hidden text-text-3 sm:inline">
                    {person.document ?? '—'}
                  </span>
                  <PersonTypeBadges types={person.types} />
                  <span className="olv-data tabular hidden text-text-3 md:inline">
                    {formatDateMedium(person.createdAt, locale)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-border px-5 py-10 text-center text-sm text-text-2">
            {t('erp.home.noRecords')}{' '}
            <Link
              href={ROUTES.people.new}
              className="font-semibold text-foreground underline underline-offset-3"
            >
              {t('erp.home.addFirst')}
            </Link>
            .
          </p>
        )}
      </section>
    </div>
  );
}
