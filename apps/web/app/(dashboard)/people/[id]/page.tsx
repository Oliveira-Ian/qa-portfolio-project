import type { Metadata } from 'next';
import { PersonForm } from '@/components/people/person-form';

export const metadata: Metadata = {
  title: 'View Person | Oliveira ERP',
};

export default async function ViewPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PersonForm mode="view" personId={id} />;
}
