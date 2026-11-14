import type { Metadata } from 'next';
import { ProfileList } from '@/components/profiles/profile-list';
import { PROFILE_FILTERABLE_COLUMNS } from '@/components/profiles/profile-filter-fields';
import { NoPermission } from '@/components/platform/no-permission';
import { getTranslator } from '@/lib/i18n/server';
import { parseListQuery, toURLSearchParams } from '@/lib/list-query';
import { can } from '@/lib/permissions';
import {
  deleteProfilesAction,
  duplicateProfileAction,
  saveProfileGridAction,
} from './_actions/profile-actions';
import { profileAccess, profileGrid } from './_data-access/profile-access';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: t('accessControl.profiles.title') };
}

interface ProfilesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * The FSM's access profiles, gated by the FSM's `profile:manage`
 * (docs/product/access_control.md). Without it the user sees why instead of
 * being sent home (design S09); the API refuses the data either way.
 */
export default async function ProfilesPage({ searchParams }: ProfilesPageProps) {
  if (!(await can('FSM', 'profile:manage'))) {
    return <NoPermission product="FSM" screen="nav.fsm.accessProfiles" />;
  }

  const query = parseListQuery(toURLSearchParams(await searchParams), PROFILE_FILTERABLE_COLUMNS);
  const [result, gridPreference] = await Promise.all([
    profileAccess.list(query),
    profileGrid.getPreference(),
  ]);

  return (
    <ProfileList
      product="FSM"
      profiles={result.items}
      total={result.total}
      gridPreference={gridPreference}
      deleteAction={deleteProfilesAction}
      duplicateAction={duplicateProfileAction}
      saveGridPreferenceAction={saveProfileGridAction}
    />
  );
}
