import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/navigation/routes';
import { can, isAdmin } from '@/lib/permissions';
import { EditPersonForm } from './_components/edit-person-form';
import { getAccountForPerson } from '../_data-access/get-account-for-person';
import { getPerson } from '../_data-access/get-person';

export const metadata: Metadata = {
  title: 'Edit person',
};

interface EditPersonPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPersonPage({ params }: EditPersonPageProps) {
  if (!(await can('person:edit'))) {
    redirect(ROUTES.people.list);
  }

  const { id } = await params;
  const [person, admin] = await Promise.all([getPerson(id), isAdmin()]);
  const account = admin && person.types.includes('USER') ? await getAccountForPerson(id) : null;

  return <EditPersonForm person={person} account={account} isAdmin={admin} />;
}
