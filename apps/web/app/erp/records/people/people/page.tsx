import type { Metadata } from 'next';
import { NoPermission } from '@/components/platform/no-permission';
import { getTranslator } from '@/lib/i18n/server';
import { parseListQuery, toURLSearchParams } from '@/lib/list-query';
import { can } from '@/lib/permissions';
import { getRegistrySummary } from '@/app/erp/_data-access/get-registry-summary';
import { PersonList } from './_components/person-list';
import { PERSON_FILTERABLE_COLUMNS } from './_components/person-filter-fields';
import { getPersonGridPreference } from './_data-access/get-grid-preferences';
import { listPersons } from './_data-access/list-persons';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: t('erp.people.title') };
}

interface PeoplePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * The rows are fetched on the server and handed to the client component fully
 * formed — no loading spinner on first paint, no token in the browser.
 *
 * `searchParams` is the one source of truth for page/sort/filter/search
 * (`docs/design/patterns/listing_pages.md`): a table-state change in
 * `PersonList` navigates to a new URL rather than touching local state, and
 * this Server Component re-runs on that navigation and asks the API for
 * exactly the page it describes — there is no client-side fetch, since the
 * session token never leaves the server.
 *
 * Without the View permission the user sees why (design S09) instead of an
 * error page; the API refuses the rows either way. Permission flags are
 * resolved here too and passed down as plain booleans: `PersonList` is a client
 * component (it owns selection state and dialogs), so it can't call the async
 * `can()` helper itself — the nearest Server Component has to check first and
 * hand over the answer.
 */
export default async function PeoplePage({ searchParams }: PeoplePageProps) {
  if (!(await can('person:view'))) {
    return <NoPermission screen="nav.erp.people" />;
  }

  const query = parseListQuery(toURLSearchParams(await searchParams), PERSON_FILTERABLE_COLUMNS);

  const [result, summary, canCreate, canEdit, canDelete, gridPreference] = await Promise.all([
    listPersons(query),
    getRegistrySummary(),
    can('person:create'),
    can('person:edit'),
    can('person:delete'),
    getPersonGridPreference(),
  ]);

  return (
    <PersonList
      people={result.items}
      total={result.total}
      counts={{ total: summary.total, clients: summary.clients, suppliers: summary.suppliers }}
      canCreate={canCreate}
      canEdit={canEdit}
      canDelete={canDelete}
      gridPreference={gridPreference}
    />
  );
}
