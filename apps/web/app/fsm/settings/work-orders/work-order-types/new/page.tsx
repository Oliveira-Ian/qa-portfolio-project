import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslator } from '@/lib/i18n/server';
import { ROUTES } from '@/lib/navigation/routes';
import { can } from '@/lib/permissions';
import { WorkOrderTypeForm } from '../_components/work-order-type-form';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: t('fsm.workOrderTypes.form.newTitle') };
}

export default async function NewWorkOrderTypePage() {
  if (!(await can('FSM', 'work-order-type:manage'))) {
    redirect(ROUTES.fsm.workOrderTypes.list);
  }

  return <WorkOrderTypeForm mode="create" />;
}
