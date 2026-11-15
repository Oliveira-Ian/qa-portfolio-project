import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/navigation/routes';
import { can } from '@/lib/permissions';
import { BranchForm } from '../../_components/branch-form';
import { branchAccess } from '../../_data-access/branch-access';

interface EditBranchPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditBranchPageProps): Promise<Metadata> {
  if (!(await can('FSM', 'branch:edit'))) {
    return {};
  }

  return { title: (await branchAccess.get((await params).id)).name };
}

export default async function EditBranchPage({ params }: EditBranchPageProps) {
  const { id } = await params;

  if (!(await can('FSM', 'branch:edit'))) {
    redirect(ROUTES.fsm.branches.view(id));
  }

  return <BranchForm mode="edit" branch={await branchAccess.get(id)} />;
}
