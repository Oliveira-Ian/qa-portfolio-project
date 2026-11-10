import type { Metadata } from 'next';
import { NoPermission } from '@/components/platform/no-permission';
import { getTranslator } from '@/lib/i18n/server';
import { can } from '@/lib/permissions';
import { listPermissions } from '../_data-access/list-permissions';
import { ProfileRecord } from './_components/profile-record';
import { getProfile } from './_data-access/get-profile';

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const [t, profile] = await Promise.all([getTranslator(), getProfile(Number.parseInt(id, 10))]);

  return { title: profile.name || t('erp.profiles.title') };
}

/** One profile, read-only — what a double click on the list opens. */
export default async function ProfilePage({ params }: ProfilePageProps) {
  if (!(await can('ERP', 'profile:manage'))) {
    return <NoPermission screen="erp.profiles.title" />;
  }

  const { id } = await params;
  const [profile, permissions] = await Promise.all([
    getProfile(Number.parseInt(id, 10)),
    listPermissions(),
  ]);

  return <ProfileRecord profile={profile} permissions={permissions} />;
}
