import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/permissions';
import { CreateProfileForm } from './_components/create-profile-form';
import { listPermissions } from '../_data-access/list-permissions';

export const metadata: Metadata = {
  title: 'New profile',
};

export default async function NewProfilePage() {
  if (!(await isAdmin())) {
    redirect('/home');
  }

  const permissions = await listPermissions();

  return <CreateProfileForm permissions={permissions} />;
}
