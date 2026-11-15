import type { Metadata } from 'next';
import { NoPermission } from '@/components/platform/no-permission';
import { getTranslator } from '@/lib/i18n/server';
import { parseListQuery, toURLSearchParams } from '@/lib/list-query';
import { can } from '@/lib/permissions';
import { WorkOrderList } from '../work-orders/_components/work-order-list';
import { WORK_ORDER_FILTERABLE_COLUMNS } from '../work-orders/_components/work-order-filters';
import {
  getWorkOrderFilterChoices,
  listWorkOrders,
  workOrderGrid,
} from '../work-orders/_data-access/work-order-access';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: t('fsm.workOrders.mine.title') };
}

interface MyWorkOrdersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** The technician's day: the work orders assigned to them — `work-order:execute`. */
export default async function MyWorkOrdersPage({ searchParams }: MyWorkOrdersPageProps) {
  if (!(await can('FSM', 'work-order:execute'))) {
    return <NoPermission product="FSM" screen="nav.fsm.myWorkOrders" />;
  }

  const query = parseListQuery(
    toURLSearchParams(await searchParams),
    WORK_ORDER_FILTERABLE_COLUMNS,
  );
  const [result, gridPreference, filterChoices] = await Promise.all([
    listWorkOrders(query, { mine: 'true' }),
    workOrderGrid.getPreference(),
    getWorkOrderFilterChoices(),
  ]);

  return (
    <WorkOrderList
      rows={result.items}
      total={result.total}
      mode="mine"
      canCreate={false}
      canEdit={false}
      gridPreference={gridPreference}
      filterChoices={filterChoices}
    />
  );
}
