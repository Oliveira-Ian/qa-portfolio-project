import type { Metadata } from 'next';
import { NoPermission } from '@/components/platform/no-permission';
import { getTranslator } from '@/lib/i18n/server';
import { parseListQuery, toURLSearchParams } from '@/lib/list-query';
import { can } from '@/lib/permissions';
import { EquipmentList } from './_components/equipment-list';
import { EQUIPMENT_FILTERABLE_COLUMNS } from './_components/equipment-filters';
import { equipmentAccess, equipmentGrid } from './_data-access/equipment-access';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: t('fsm.equipment.list.title') };
}

interface EquipmentPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** The customers' equipment — the URL holds the page, the sort and the filters. */
export default async function EquipmentPage({ searchParams }: EquipmentPageProps) {
  if (!(await can('FSM', 'equipment:view'))) {
    return <NoPermission product="FSM" screen="nav.fsm.equipment" />;
  }

  const query = parseListQuery(toURLSearchParams(await searchParams), EQUIPMENT_FILTERABLE_COLUMNS);
  const [result, gridPreference, canCreate, canEdit, canDelete] = await Promise.all([
    equipmentAccess.list(query),
    equipmentGrid.getPreference(),
    can('FSM', 'equipment:create'),
    can('FSM', 'equipment:edit'),
    can('FSM', 'equipment:delete'),
  ]);

  return (
    <EquipmentList
      rows={result.items}
      total={result.total}
      can={{ create: canCreate, edit: canEdit, delete: canDelete }}
      gridPreference={gridPreference}
    />
  );
}
