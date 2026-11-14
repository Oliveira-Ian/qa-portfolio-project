import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/navigation/routes';
import { can } from '@/lib/permissions';
import { WorkOrderTypeForm } from '../../_components/work-order-type-form';
import { workOrderTypeAccess } from '../../_data-access/work-order-type-access';

interface EditWorkOrderTypePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditWorkOrderTypePageProps): Promise<Metadata> {
  if (!(await can('FSM', 'work-order-type:manage'))) {
    return {};
  }

  return { title: (await workOrderTypeAccess.get((await params).id)).name };
}

export default async function EditWorkOrderTypePage({ params }: EditWorkOrderTypePageProps) {
  const { id } = await params;

  if (!(await can('FSM', 'work-order-type:manage'))) {
    redirect(ROUTES.fsm.workOrderTypes.view(id));
  }

  return <WorkOrderTypeForm mode="edit" type={await workOrderTypeAccess.get(id)} />;
}
