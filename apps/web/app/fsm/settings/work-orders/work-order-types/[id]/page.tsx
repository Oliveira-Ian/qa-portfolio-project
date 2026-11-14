import type { Metadata } from 'next';
import { NoPermission } from '@/components/platform/no-permission';
import { can } from '@/lib/permissions';
import { WorkOrderTypeForm } from '../_components/work-order-type-form';
import { workOrderTypeAccess } from '../_data-access/work-order-type-access';

interface WorkOrderTypePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: WorkOrderTypePageProps): Promise<Metadata> {
  if (!(await can('FSM', 'work-order-type:manage'))) {
    return {};
  }

  return { title: (await workOrderTypeAccess.get((await params).id)).name };
}

export default async function WorkOrderTypePage({ params }: WorkOrderTypePageProps) {
  if (!(await can('FSM', 'work-order-type:manage'))) {
    return <NoPermission product="FSM" screen="nav.fsm.workOrderTypes" />;
  }

  const type = await workOrderTypeAccess.get((await params).id);

  return <WorkOrderTypeForm mode="view" type={type} canEdit />;
}
