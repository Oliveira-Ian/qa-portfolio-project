import type { Metadata } from 'next';
import { PersonList } from '@/components/people/person-list';

export const metadata: Metadata = {
  title: 'People | Oliveira ERP',
};

export default function PeoplePage() {
  return <PersonList />;
}
