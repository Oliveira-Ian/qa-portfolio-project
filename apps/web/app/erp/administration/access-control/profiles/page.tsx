import type { Metadata } from 'next';
import { NoPermission } from '@/components/platform/no-permission';
import { getTranslator } from '@/lib/i18n/server';
import { parseListQuery, toURLSearchParams } from '@/lib/list-query';
import { can } from '@/lib/permissions';
import { ProfileList } from './_components/profile-list';
import { PROFILE_FILTERABLE_COLUMNS } from './_components/profile-filter-fields';
import { getProfileGridPreference } from './_data-access/get-grid-preferences';
import { listProfiles } from './_data-access/list-profiles';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: t('erp.profiles.title') };
}

interface ProfilesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Gated by `profile:manage` (docs/product/access_control.md). Without it the
 * user sees why — their ERP access profile doesn't include this screen — instead
 * of being sent home (design S09); the API refuses the data either way.
 */
export default async function ProfilesPage({ searchParams }: ProfilesPageProps) {
  if (!(await can('profile:manage'))) {
    return <NoPermission screen="erp.profiles.title" />;
  }

  const query = parseListQuery(toURLSearchParams(await searchParams), PROFILE_FILTERABLE_COLUMNS);

  const [result, gridPreference] = await Promise.all([
    listProfiles(query),
    getProfileGridPreference(),
  ]);

  return (
    <ProfileList profiles={result.items} total={result.total} gridPreference={gridPreference} />
  );
}
