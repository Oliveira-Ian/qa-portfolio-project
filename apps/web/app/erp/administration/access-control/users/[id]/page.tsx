import type { Metadata } from 'next';
import { UserRecord } from '@/components/access-control/user-record';
import { NoPermission } from '@/components/platform/no-permission';
import { ROUTES } from '@/lib/navigation/routes';
import { can } from '@/lib/permissions';
import { getAccount } from '../_data-access/get-account';

interface UserPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: UserPageProps): Promise<Metadata> {
  const account = await getAccount(Number.parseInt((await params).id, 10));

  return { title: account.personName };
}

/** One member as the ERP sees them — what a double click on the Users list opens. */
export default async function UserPage({ params }: UserPageProps) {
  if (!(await can('ERP', 'profile:manage'))) {
    return <NoPermission screen="accessControl.users.title" />;
  }

  const account = await getAccount(Number.parseInt((await params).id, 10));

  return <UserRecord product="ERP" account={account} basePath={ROUTES.accounts.list} />;
}
