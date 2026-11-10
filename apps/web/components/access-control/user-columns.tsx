'use client';

import type { ColumnDef, HeaderContext } from '@tanstack/react-table';
import type { AccountDto } from '@oliveira/schemas';
import { ColumnFilter } from '@/components/data-table/column-filter';
import { ColumnHeader } from '@/components/data-table/column-header';
import { filterableColumn } from '@/components/data-table/column-helpers';
import type { ExportColumn } from '@/components/data-table/export-modal';
import type { CustomizableColumn } from '@/components/data-table/grid-customization-modal';
import { StatusBadge } from '@/components/ui/badge';
import { formatDateMedium } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n/provider';
import type { MessageKey } from '@/lib/i18n/translate';

const TESTID_PREFIX = 'user-list';

function renderHeader(labelKey: MessageKey) {
  return function UserColumnHeader({ column }: HeaderContext<AccountDto, unknown>) {
    const t = useT();
    const label = t(labelKey);

    return (
      <div className="flex items-center gap-1">
        <ColumnHeader
          column={column}
          label={label}
          testId={`${TESTID_PREFIX}-column-header-${column.id}`}
        />
        <ColumnFilter column={column} label={label} testIdPrefix={TESTID_PREFIX} />
      </div>
    );
  };
}

function ProfileCell({ account }: { account: AccountDto }) {
  const t = useT();

  return account.profile ? (
    <span className="text-foreground">{account.profile.name}</span>
  ) : (
    <span className="text-text-3">{t('accessControl.users.noProfile')}</span>
  );
}

function StatusCell({ active }: { active: boolean }) {
  const t = useT();

  return (
    <StatusBadge tone={active ? 'success' : 'neutral'}>
      {t(active ? 'accessControl.users.active' : 'accessControl.users.inactive')}
    </StatusBadge>
  );
}

function DateCell({ value }: { value: string }) {
  const locale = useLocale();

  return <span className="olv-data text-text-2">{formatDateMedium(value, locale)}</span>;
}

/** A product's members and the one profile each holds there — read-only cells, actions live in the header. */
export const userColumns: ColumnDef<AccountDto>[] = [
  {
    accessorKey: 'personName',
    header: renderHeader('accessControl.users.columns.name'),
    cell: ({ getValue }) => (
      <span className="font-medium text-foreground">{getValue<string>()}</span>
    ),
    ...filterableColumn<AccountDto>('text', undefined, 'accessControl.users.columns.name'),
  },
  {
    accessorKey: 'email',
    header: renderHeader('accessControl.users.columns.email'),
    cell: ({ getValue }) => <span className="olv-data text-text-2">{getValue<string>()}</span>,
    ...filterableColumn<AccountDto>('text', undefined, 'accessControl.users.columns.email'),
  },
  {
    id: 'profile',
    accessorFn: (account) => account.profile?.name ?? '',
    header: renderHeader('accessControl.users.columns.profile'),
    enableSorting: false,
    cell: ({ row }) => <ProfileCell account={row.original} />,
    ...filterableColumn<AccountDto>('text', undefined, 'accessControl.users.columns.profile'),
  },
  {
    accessorKey: 'active',
    header: renderHeader('accessControl.users.columns.status'),
    cell: ({ getValue }) => <StatusCell active={getValue<boolean>()} />,
    ...filterableColumn<AccountDto>('boolean', undefined, 'accessControl.users.columns.status'),
  },
  {
    accessorKey: 'createdAt',
    header: renderHeader('accessControl.users.columns.created'),
    cell: ({ getValue }) => <DateCell value={getValue<string>()} />,
    ...filterableColumn<AccountDto>('date', undefined, 'accessControl.users.columns.created'),
  },
];

export const USER_EXPORT_COLUMNS: ExportColumn<AccountDto>[] = [
  {
    key: 'personName',
    labelKey: 'accessControl.users.columns.name',
    getValue: (account) => account.personName,
  },
  {
    key: 'email',
    labelKey: 'accessControl.users.columns.email',
    getValue: (account) => account.email,
  },
  {
    key: 'profile',
    labelKey: 'accessControl.users.columns.profile',
    getValue: (account) => account.profile?.name ?? '',
  },
  {
    key: 'active',
    labelKey: 'accessControl.users.columns.status',
    getValue: (account, { t }) =>
      t(account.active ? 'accessControl.users.active' : 'accessControl.users.inactive'),
  },
  {
    key: 'createdAt',
    labelKey: 'accessControl.users.columns.created',
    getValue: (account) => account.createdAt,
  },
];

export const USER_CUSTOMIZABLE_COLUMNS: CustomizableColumn[] = USER_EXPORT_COLUMNS.map(
  ({ key, labelKey }) => ({ key, labelKey }),
);
