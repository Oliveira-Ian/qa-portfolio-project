import type { Metadata } from 'next';
import { NoPermission } from '@/components/platform/no-permission';
import { getTranslator } from '@/lib/i18n/server';
import { parseListQuery, toURLSearchParams } from '@/lib/list-query';
import { can, getMe } from '@/lib/permissions';
import { BranchList } from './_components/branch-list';
import { BRANCH_FILTERABLE_COLUMNS } from './_components/branch-filters';
import { branchAccess, branchGrid } from './_data-access/branch-access';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: t('fsm.branches.list.title') };
}

interface BranchesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * The company's branches, managed in the FSM with its `branch:*` permissions.
 * The company itself is shown for context only — it is the Platform's.
 */
export default async function BranchesPage({ searchParams }: BranchesPageProps) {
  if (!(await can('FSM', 'branch:view'))) {
    return <NoPermission product="FSM" screen="nav.fsm.branches" />;
  }

  const query = parseListQuery(toURLSearchParams(await searchParams), BRANCH_FILTERABLE_COLUMNS);
  const [result, gridPreference, me, canCreate, canEdit, canDelete] = await Promise.all([
    branchAccess.list(query),
    branchGrid.getPreference(),
    getMe(),
    can('FSM', 'branch:create'),
    can('FSM', 'branch:edit'),
    can('FSM', 'branch:delete'),
  ]);

  return (
    <BranchList
      rows={result.items}
      total={result.total}
      companyName={me.membership?.companyName ?? ''}
      can={{ create: canCreate, edit: canEdit, delete: canDelete }}
      gridPreference={gridPreference}
    />
  );
}
