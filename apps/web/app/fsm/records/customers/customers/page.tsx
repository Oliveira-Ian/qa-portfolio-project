import type { Metadata } from 'next';
import { NoPermission } from '@/components/platform/no-permission';
import { getTranslator } from '@/lib/i18n/server';
import { parseListQuery, toURLSearchParams } from '@/lib/list-query';
import { can } from '@/lib/permissions';
import { CustomerList } from './_components/customer-list';
import { CUSTOMER_FILTERABLE_COLUMNS } from './_components/customer-filters';
import { customerAccess, customerGrid } from './_data-access/customer-access';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: t('fsm.customers.list.title') };
}

interface CustomersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** The FSM's customers — the URL holds the page, the sort and the filters. */
export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  if (!(await can('FSM', 'customer:view'))) {
    return <NoPermission product="FSM" screen="nav.fsm.customers" />;
  }

  const query = parseListQuery(toURLSearchParams(await searchParams), CUSTOMER_FILTERABLE_COLUMNS);
  const [result, gridPreference, canCreate, canEdit, canDelete] = await Promise.all([
    customerAccess.list(query),
    customerGrid.getPreference(),
    can('FSM', 'customer:create'),
    can('FSM', 'customer:edit'),
    can('FSM', 'customer:delete'),
  ]);

  return (
    <CustomerList
      rows={result.items}
      total={result.total}
      can={{ create: canCreate, edit: canEdit, delete: canDelete }}
      gridPreference={gridPreference}
    />
  );
}
