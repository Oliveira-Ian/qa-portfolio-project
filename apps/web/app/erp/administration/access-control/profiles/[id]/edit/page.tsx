import type { Metadata } from 'next';
import { NoPermission } from '@/components/platform/no-permission';
import { getTranslator } from '@/lib/i18n/server';
import { can } from '@/lib/permissions';
import { EditProfileForm } from './_components/edit-profile-form';
import { getProfile } from '../_data-access/get-profile';
import { listPermissions } from '../../_data-access/list-permissions';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: t('erp.profiles.form.editTitle') };
}

interface EditProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProfilePage({ params }: EditProfilePageProps) {
  if (!(await can('profile:manage'))) {
    return <NoPermission screen="erp.profiles.title" />;
  }

  const { id } = await params;
  const [profile, permissions] = await Promise.all([
    getProfile(Number.parseInt(id, 10)),
    listPermissions(),
  ]);

  return <EditProfileForm profile={profile} permissions={permissions} />;
}
