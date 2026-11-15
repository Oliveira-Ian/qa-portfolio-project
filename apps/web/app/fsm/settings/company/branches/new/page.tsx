import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslator } from '@/lib/i18n/server';
import { ROUTES } from '@/lib/navigation/routes';
import { can } from '@/lib/permissions';
import { BranchForm } from '../_components/branch-form';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: t('fsm.branches.form.newTitle') };
}

export default async function NewBranchPage() {
  if (!(await can('FSM', 'branch:create'))) {
    redirect(ROUTES.fsm.branches.list);
  }

  return <BranchForm mode="create" />;
}
