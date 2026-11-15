import type { Metadata } from 'next';
import { formatWorkOrderNumber } from '@oliveira/schemas';
import { NoPermission } from '@/components/platform/no-permission';
import { ROUTES } from '@/lib/navigation/routes';
import { can, getMe } from '@/lib/permissions';
import { WorkOrderRecord } from '../_components/work-order-record';
import { getWorkOrder } from '../_data-access/work-order-access';

interface WorkOrderPageProps {
  params: Promise<{ id: string }>;
}

async function canRead(): Promise<boolean> {
  const [view, execute] = await Promise.all([
    can('FSM', 'work-order:view'),
    can('FSM', 'work-order:execute'),
  ]);

  return view || execute;
}

export async function generateMetadata({ params }: WorkOrderPageProps): Promise<Metadata> {
  if (!(await canRead())) {
    return {};
  }

  const workOrder = await getWorkOrder((await params).id);

  return { title: `${formatWorkOrderNumber(workOrder.number)} · ${workOrder.title}` };
}

/**
 * One work order and the work on it. A technician sees only theirs — another's
 * reads as not found, like another company's.
 */
export default async function WorkOrderPage({ params }: WorkOrderPageProps) {
  if (!(await canRead())) {
    return <NoPermission product="FSM" screen="nav.fsm.workOrders" />;
  }

  const [workOrder, me, canView, canEdit, canChangeStatus, canExecute] = await Promise.all([
    getWorkOrder((await params).id),
    getMe(),
    can('FSM', 'work-order:view'),
    can('FSM', 'work-order:edit'),
    can('FSM', 'work-order:change-status'),
    can('FSM', 'work-order:execute'),
  ]);

  return (
    <WorkOrderRecord
      workOrder={workOrder}
      abilities={{
        canEdit,
        canChangeStatus,
        canExecute,
        membershipId: me.membership?.id ?? null,
      }}
      backHref={canView ? ROUTES.fsm.workOrders.list : ROUTES.fsm.myWorkOrders}
    />
  );
}
