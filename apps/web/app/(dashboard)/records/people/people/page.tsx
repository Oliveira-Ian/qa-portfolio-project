import type { Metadata } from 'next';
import { PersonList } from './_components/person-list';
import { getPersonGridPreference } from './_data-access/get-grid-preferences';
import { listPersons } from './_data-access/list-persons';
import { can } from '@/lib/permissions';

export const metadata: Metadata = {
  title: 'People',
};

/**
 * The rows are fetched on the server and handed to the client component fully
 * formed — no loading spinner on first paint, no token in the browser.
 *
 * Permission flags are resolved here too and passed down as plain booleans:
 * `PersonList` is a client component (it owns selection state and dialogs),
 * so it can't call the async `can()` helper itself — the nearest Server
 * Component has to check first and hand over the answer.
 */
export default async function PeoplePage() {
  const [people, canCreate, canEdit, canDelete, gridPreference] = await Promise.all([
    listPersons(),
    can('person:create'),
    can('person:edit'),
    can('person:delete'),
    getPersonGridPreference(),
  ]);

  return (
    <PersonList
      people={people}
      canCreate={canCreate}
      canEdit={canEdit}
      canDelete={canDelete}
      gridPreference={gridPreference}
    />
  );
}
