import type { Metadata } from 'next';
import { NoPermission } from '@/components/platform/no-permission';
import { getTranslator } from '@/lib/i18n/server';
import { can } from '@/lib/permissions';
import { CreateProfileForm } from './_components/create-profile-form';
import { listPermissions } from '../_data-access/list-permissions';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: t('erp.profiles.form.newTitle') };
}

export default async function NewProfilePage() {
  if (!(await can('profile:manage'))) {
    return <NoPermission screen="erp.profiles.title" />;
  }

  const permissions = await listPermissions();

  return <CreateProfileForm permissions={permissions} />;
}
