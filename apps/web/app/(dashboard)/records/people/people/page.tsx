import type { Metadata } from 'next';
import { parseListQuery, toURLSearchParams } from '@/lib/list-query';
import { can } from '@/lib/permissions';
import { PersonList } from './_components/person-list';
import { PERSON_FILTERABLE_COLUMNS } from './_components/person-filter-fields';
import { getPersonGridPreference } from './_data-access/get-grid-preferences';
import { listPersons } from './_data-access/list-persons';

export const metadata: Metadata = {
  title: 'People',
};

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
 * Permission flags are resolved here too and passed down as plain booleans:
 * `PersonList` is a client component (it owns selection state and dialogs),
 * so it can't call the async `can()` helper itself — the nearest Server
 * Component has to check first and hand over the answer.
 */
export default async function PeoplePage({ searchParams }: PeoplePageProps) {
  const query = parseListQuery(toURLSearchParams(await searchParams), PERSON_FILTERABLE_COLUMNS);

  const [result, canCreate, canEdit, canDelete, gridPreference] = await Promise.all([
    listPersons(query),
    can('person:create'),
    can('person:edit'),
    can('person:delete'),
    getPersonGridPreference(),
  ]);

  return (
    <PersonList
      people={result.items}
      total={result.total}
      canCreate={canCreate}
      canEdit={canEdit}
      canDelete={canDelete}
      gridPreference={gridPreference}
    />
  );
}
