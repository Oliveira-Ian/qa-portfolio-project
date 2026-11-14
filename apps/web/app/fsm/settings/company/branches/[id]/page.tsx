import type { Metadata } from 'next';
import { NoPermission } from '@/components/platform/no-permission';
import { can } from '@/lib/permissions';
import { BranchForm } from '../_components/branch-form';
import { branchAccess } from '../_data-access/branch-access';

interface BranchPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: BranchPageProps): Promise<Metadata> {
  if (!(await can('FSM', 'branch:view'))) {
    return {};
  }

  return { title: (await branchAccess.get((await params).id)).name };
}

export default async function BranchPage({ params }: BranchPageProps) {
  if (!(await can('FSM', 'branch:view'))) {
    return <NoPermission product="FSM" screen="nav.fsm.branches" />;
  }

  const [branch, canEdit] = await Promise.all([
    branchAccess.get((await params).id),
    can('FSM', 'branch:edit'),
  ]);

  return <BranchForm mode="view" branch={branch} canEdit={canEdit} />;
}
