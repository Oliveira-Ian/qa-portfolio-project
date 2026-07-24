import type { Metadata } from 'next';
import { PersonForm } from '@/components/people/person-form';

export const metadata: Metadata = {
  title: 'Edit Person | Oliveira ERP',
};

export default async function EditPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PersonForm mode="edit" personId={id} />;
}
