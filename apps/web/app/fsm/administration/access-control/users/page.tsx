import type { Metadata } from 'next';
import { UserList } from '@/components/access-control/user-list';
import { USER_FILTERABLE_COLUMNS } from '@/components/access-control/user-filter-fields';
import { NoPermission } from '@/components/platform/no-permission';
import { getTranslator } from '@/lib/i18n/server';
import { parseListQuery, toURLSearchParams } from '@/lib/list-query';
import { ROUTES } from '@/lib/navigation/routes';
import { can } from '@/lib/permissions';
import { getProfileFilterOptions } from '@/lib/profile-filter-options';
import { saveFsmAccountGridAction } from './_actions/user-actions';
import { fsmAccountGrid, listFsmAccounts } from './_data-access/user-access';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: t('accessControl.users.title') };
}

interface UsersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** The FSM's users — every member of the company, with the one FSM profile each holds. */
export default async function FsmUsersPage({ searchParams }: UsersPageProps) {
  if (!(await can('FSM', 'profile:manage'))) {
    return <NoPermission product="FSM" screen="nav.fsm.users" />;
  }

  const query = parseListQuery(toURLSearchParams(await searchParams), USER_FILTERABLE_COLUMNS);
  const [accounts, gridPreference, profileOptions] = await Promise.all([
    listFsmAccounts(query),
    fsmAccountGrid.getPreference(),
    getProfileFilterOptions('FSM'),
  ]);

  return (
    <UserList
      product="FSM"
      accounts={accounts.items}
      total={accounts.total}
      gridPreference={gridPreference}
      saveGridPreferenceAction={saveFsmAccountGridAction}
      profileOptions={profileOptions}
      basePath={ROUTES.fsm.users.list}
    />
  );
}
