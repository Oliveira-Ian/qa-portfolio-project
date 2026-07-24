import type { Metadata } from 'next';
import { PersonForm } from '@/components/people/person-form';

export const metadata: Metadata = {
  title: 'New Person | Oliveira ERP',
};

export default function NewPersonPage() {
  return <PersonForm mode="create" />;
}
