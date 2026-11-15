import type { Metadata } from 'next';
import { NoPermission } from '@/components/platform/no-permission';
import { getTranslator } from '@/lib/i18n/server';
import { parseListQuery, toURLSearchParams } from '@/lib/list-query';
import { can } from '@/lib/permissions';
import { WorkOrderTypeList } from './_components/work-order-type-list';
import { WORK_ORDER_TYPE_FILTERABLE_COLUMNS } from './_components/work-order-type-filters';
import { workOrderTypeAccess, workOrderTypeGrid } from './_data-access/work-order-type-access';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: t('fsm.workOrderTypes.list.title') };
}

interface WorkOrderTypesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** The FSM's work order types — the URL holds the page, the sort and the filters. */
export default async function WorkOrderTypesPage({ searchParams }: WorkOrderTypesPageProps) {
  if (!(await can('FSM', 'work-order-type:manage'))) {
    return <NoPermission product="FSM" screen="nav.fsm.workOrderTypes" />;
  }

  const query = parseListQuery(
    toURLSearchParams(await searchParams),
    WORK_ORDER_TYPE_FILTERABLE_COLUMNS,
  );
  const [result, gridPreference] = await Promise.all([
    workOrderTypeAccess.list(query),
    workOrderTypeGrid.getPreference(),
  ]);

  return (
    <WorkOrderTypeList
      rows={result.items}
      total={result.total}
      canManage
      gridPreference={gridPreference}
    />
  );
}
