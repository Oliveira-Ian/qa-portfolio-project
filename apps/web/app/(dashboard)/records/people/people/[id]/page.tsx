import type { Metadata } from 'next';
import { isAdmin } from '@/lib/permissions';
import { PersonRecord } from './_components/person-record';
import { getAccountForPerson } from './_data-access/get-account-for-person';
import { getPerson } from './_data-access/get-person';

interface PersonPageProps {
  params: Promise<{ id: string }>;
}

/** The record's own name in the tab, so several open sheets stay tellable apart. */
export async function generateMetadata({ params }: PersonPageProps): Promise<Metadata> {
  const { id } = await params;
  const person = await getPerson(id);

  return { title: person.name };
}

export default async function PersonPage({ params }: PersonPageProps) {
  const { id } = await params;
  // `getPerson` is request-cached, so generateMetadata and this share one call.
  const [person, admin] = await Promise.all([getPerson(id), isAdmin()]);
  // The accounts endpoint is ADMIN-only and only meaningful for USER-typed
  // people — skip the call entirely rather than let it fail on purpose.
  const account = admin && person.types.includes('USER') ? await getAccountForPerson(id) : null;

  return <PersonRecord person={person} account={account} isAdmin={admin} />;
}
