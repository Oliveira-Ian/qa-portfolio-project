import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { PersonTypeBadges } from '@/components/people/person-badges';
import { Button } from '@/components/ui/button';
import { formatCount, formatDate } from '@/lib/format';
import { ROUTES } from '@/lib/navigation/routes';
import { getSessionAccount } from '@/lib/session';
import { getRegistrySummary } from './_data-access/get-registry-summary';

export const metadata: Metadata = {
  title: 'Home',
};

/** Two independent reads — no reason for the second to wait on the first. */
export default async function HomePage() {
  const [account, summary] = await Promise.all([getSessionAccount(), getRegistrySummary()]);

  const firstName = account?.name.trim().split(' ')[0] ?? 'there';

  const stats = [
    { label: 'Records', value: summary.total },
    { label: 'Clients', value: summary.clients },
    { label: 'Suppliers', value: summary.suppliers },
    { label: 'Inactive', value: summary.inactive },
  ];

  return (
    <div data-testid="home-page">
      <PageHeader
        eyebrow="Overview"
        title={`Good to see you, ${firstName}`}
        description="Everything the site depends on, kept in one register."
        titleTestId="home-page-title"
        actions={
          <Button asChild data-testid="home-button-people">
            <Link href={ROUTES.people.list}>
              Open the registry
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border shadow-card lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card px-5 py-6">
            <dt className="eyebrow text-muted-foreground">{stat.label}</dt>
            <dd className="tabular mt-2 text-3xl leading-none font-medium text-foreground">
              {formatCount(stat.value)}
            </dd>
          </div>
        ))}
      </dl>

      <section className="mt-8" aria-labelledby="recent-records-heading">
        <div className="flex items-end justify-between gap-4">
          <h2 id="recent-records-heading" className="text-lg font-semibold text-foreground">
            Latest entries
          </h2>
          <Link
            href={ROUTES.people.list}
            className="rounded-sm text-sm text-primary underline underline-offset-4 hover:text-primary-hover focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
            data-testid="home-link-all-people"
          >
            See all
          </Link>
        </div>
        <div className="measured-rule mt-4" aria-hidden="true" />

        {summary.recent.length > 0 ? (
          <ul className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-card">
            {summary.recent.map((person) => (
              <li key={person.id}>
                <Link
                  href={ROUTES.people.view(person.id)}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none focus-visible:-outline-offset-2"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {person.name}
                  </span>
                  <span className="tabular hidden text-xs text-muted-foreground sm:inline">
                    {person.document ?? '—'}
                  </span>
                  <PersonTypeBadges types={person.types} />
                  <span className="tabular hidden text-xs text-text-muted md:inline">
                    {formatDate(person.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-lg border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
            No records yet.{' '}
            <Link
              href={ROUTES.people.new}
              className="text-primary underline underline-offset-4 hover:text-primary-hover"
            >
              Add the first one
            </Link>
            .
          </p>
        )}
      </section>
    </div>
  );
}
