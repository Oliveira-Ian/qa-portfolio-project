import type { Metadata } from 'next';
import { NoPermission } from '@/components/platform/no-permission';
import { getTranslator } from '@/lib/i18n/server';
import { parseListQuery, toURLSearchParams } from '@/lib/list-query';
import { can } from '@/lib/permissions';
import { WorkOrderList } from './_components/work-order-list';
import { WORK_ORDER_FILTERABLE_COLUMNS } from './_components/work-order-filters';
import { listWorkOrders, workOrderGrid } from './_data-access/work-order-access';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: t('fsm.workOrders.list.title') };
}

interface WorkOrdersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Every work order of the company — `work-order:view`. A technician has "My work orders". */
export default async function WorkOrdersPage({ searchParams }: WorkOrdersPageProps) {
  if (!(await can('FSM', 'work-order:view'))) {
    return <NoPermission product="FSM" screen="nav.fsm.workOrders" />;
  }

  const query = parseListQuery(
    toURLSearchParams(await searchParams),
    WORK_ORDER_FILTERABLE_COLUMNS,
  );
  const [result, gridPreference, canCreate, canEdit] = await Promise.all([
    listWorkOrders(query),
    workOrderGrid.getPreference(),
    can('FSM', 'work-order:create'),
    can('FSM', 'work-order:edit'),
  ]);

  return (
    <WorkOrderList
      rows={result.items}
      total={result.total}
      mode="all"
      canCreate={canCreate}
      canEdit={canEdit}
      gridPreference={gridPreference}
    />
  );
}
