import type { Metadata } from 'next';
import type { FsmDashboardDto } from '@oliveira/schemas';
import { NoPermission } from '@/components/platform/no-permission';
import { getTranslator } from '@/lib/i18n/server';
import { parseListQuery, toURLSearchParams } from '@/lib/list-query';
import { can, getMe } from '@/lib/permissions';
import { getFsmDashboardIfAllowed } from '../../../_data-access/get-dashboard';
import type { WorkOrderListCounts, WorkOrderView } from './_components/work-order-views';
import { WorkOrderList } from './_components/work-order-list';
import { WORK_ORDER_FILTERABLE_COLUMNS } from './_components/work-order-filters';
import {
  getWorkOrderFilterChoices,
  listWorkOrders,
  workOrderGrid,
} from './_data-access/work-order-access';

/** The views' and status chips' counts, from the dashboard summary (which already scopes to the caller). */
function listCounts(dashboard: FsmDashboardDto, membershipId: string | null): WorkOrderListCounts {
  return {
    all: Object.values(dashboard.byStatus).reduce((sum, count) => sum + count, 0),
    views: {
      unassigned: dashboard.unassigned,
      overdue: dashboard.overdue,
      today: dashboard.scheduledToday,
      ...(membershipId
        ? { mine: dashboard.teamLoad.find((row) => row.membershipId === membershipId)?.open ?? 0 }
        : {}),
    },
    byStatus: dashboard.byStatus,
  };
}

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
  const [result, gridPreference, filterChoices, canCreate, canEdit, dashboard, me, canExecute] =
    await Promise.all([
      listWorkOrders(query),
      workOrderGrid.getPreference(),
      getWorkOrderFilterChoices(),
      can('FSM', 'work-order:create'),
      can('FSM', 'work-order:edit'),
      getFsmDashboardIfAllowed(),
      getMe(),
      can('FSM', 'work-order:execute'),
    ]);
  const membershipId = canExecute ? (me.membership?.id ?? null) : null;
  const views: WorkOrderView[] = [
    'unassigned',
    'overdue',
    'today',
    ...(membershipId ? (['mine'] as const) : []),
  ];

  return (
    <WorkOrderList
      rows={result.items}
      total={result.total}
      mode="all"
      canCreate={canCreate}
      canEdit={canEdit}
      gridPreference={gridPreference}
      filterChoices={filterChoices}
      {...(dashboard ? { counts: listCounts(dashboard, membershipId) } : {})}
      views={views}
      now={new Date().toISOString()}
    />
  );
}
