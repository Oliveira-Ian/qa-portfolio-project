'use client';

import type { ColumnDef, HeaderContext } from '@tanstack/react-table';
import { ShieldCheck } from 'lucide-react';
import type { AccountDto, AccountRole } from '@oliveira/schemas';
import { ColumnFilter } from '@/components/data-table/column-filter';
import { ColumnHeader } from '@/components/data-table/column-header';
import { filterableColumn } from '@/components/data-table/column-helpers';
import type { CustomizableColumn } from '@/components/data-table/grid-customization-modal';
import type { ExportColumn } from '@/components/data-table/export-modal';
import type { FilterOption } from '@/components/data-table/types';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDateMedium } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n/provider';
import type { MessageKey } from '@/lib/i18n/translate';

const ROLE_LABEL: Record<AccountRole, MessageKey> = {
  SUPER_ADMIN: 'erp.accountRole.superAdmin',
  USER: 'erp.accountRole.user',
  SYSTEM: 'erp.accountRole.system',
};

/**
 * `SYSTEM` is deliberately not offered here — it's a reserved role for
 * integrations, assigned by seed data, not something an admin hand-picks for
 * a person's account. See `docs/product/access_control.md`.
 */
export const ACCOUNT_ROLE_OPTIONS: FilterOption[] = [
  { labelKey: ROLE_LABEL.SUPER_ADMIN, value: 'SUPER_ADMIN' },
  { labelKey: ROLE_LABEL.USER, value: 'USER' },
];

/** Every role a `SYSTEM` account can still be filtered by, even though it can't be hand-assigned. */
export const ACCOUNT_ROLE_FILTER_OPTIONS: FilterOption[] = [
  ...ACCOUNT_ROLE_OPTIONS,
  { labelKey: ROLE_LABEL.SYSTEM, value: 'SYSTEM' },
];

function renderHeader(labelKey: MessageKey) {
  return function AccountColumnHeader({ column }: HeaderContext<AccountDto, unknown>) {
    const t = useT();
    const label = t(labelKey);

    return (
      <div className="flex items-center gap-1">
        <ColumnHeader
          column={column}
          label={label}
          testId={`account-list-column-header-${column.id}`}
        />
        <ColumnFilter column={column} label={label} testIdPrefix="account-list" />
      </div>
    );
  };
}

export interface AccountColumnCallbacks {
  onRoleChange: (account: AccountDto, role: AccountRole) => void;
  onToggleActive: (account: AccountDto) => void;
  onManageProfiles: (account: AccountDto) => void;
  /** Role and active flag are a `SUPER_ADMIN`'s to change (the API refuses anyone else with 403). */
  canManageAccountState: boolean;
  isPending: boolean;
}

interface AccountCellProps extends Omit<AccountColumnCallbacks, 'isPending'> {
  account: AccountDto;
  isPending: boolean;
}

function RoleCell({ account, onRoleChange, canManageAccountState, isPending }: AccountCellProps) {
  const t = useT();

  if (account.role === 'SYSTEM') {
    return <Badge variant="default">{t(ROLE_LABEL.SYSTEM)}</Badge>;
  }

  return (
    <Select
      value={account.role}
      disabled={isPending || !canManageAccountState}
      onValueChange={(role: AccountRole) => onRoleChange(account, role)}
    >
      <SelectTrigger
        size="sm"
        className="w-36"
        aria-label={`${t('erp.columns.role')}: ${account.personName}`}
        {...(canManageAccountState ? {} : { title: t('erp.users.superAdminOnly') })}
        data-testid="account-list-select-role"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ACCOUNT_ROLE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {t(option.labelKey)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function StatusCell({
  account,
  onToggleActive,
  canManageAccountState,
  isPending,
}: AccountCellProps) {
  const t = useT();

  // Not a button when it would only answer 403: a control that never works is worse than none.
  if (!canManageAccountState) {
    return (
      <StatusBadge tone={account.active ? 'success' : 'neutral'}>
        {t(account.active ? 'erp.status.active' : 'erp.status.inactive')}
      </StatusBadge>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-2.5"
      disabled={isPending || account.role === 'SYSTEM'}
      data-testid="account-list-button-toggle-active"
      onClick={() => onToggleActive(account)}
    >
      <StatusBadge tone={account.active ? 'success' : 'neutral'}>
        {t(account.active ? 'erp.status.active' : 'erp.status.inactive')}
      </StatusBadge>
    </Button>
  );
}

function ProfilesCell({ account, onManageProfiles }: AccountCellProps) {
  const t = useT();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      data-testid="account-list-button-manage-profiles"
      onClick={() => onManageProfiles(account)}
    >
      <ShieldCheck aria-hidden="true" />
      {t('erp.users.profileCount', { count: account.profiles.length })}
    </Button>
  );
}

function DateCell({ value }: { value: string }) {
  const locale = useLocale();

  return <span className="olv-data tabular text-text-2">{formatDateMedium(value, locale)}</span>;
}

/**
 * Built by a function rather than declared as a static array (unlike
 * `person-columns.tsx`) because almost every cell here is interactive —
 * role, active/inactive and the profiles count each need a callback and
 * `isPending` from `AccountList`'s own state, not just a plain value to
 * render.
 */
export function buildAccountColumns({
  onRoleChange,
  onToggleActive,
  onManageProfiles,
  canManageAccountState,
  isPending,
}: AccountColumnCallbacks): ColumnDef<AccountDto>[] {
  const callbacks = {
    onRoleChange,
    onToggleActive,
    onManageProfiles,
    canManageAccountState,
    isPending,
  };

  return [
    {
      accessorKey: 'personName',
      header: renderHeader('erp.columns.person'),
      cell: ({ getValue }) => (
        <span className="font-medium text-foreground">{getValue<string>()}</span>
      ),
      ...filterableColumn<AccountDto>('text', undefined, 'erp.columns.person'),
    },
    {
      accessorKey: 'email',
      header: renderHeader('erp.columns.email'),
      cell: ({ getValue }) => <span className="olv-data text-text-2">{getValue<string>()}</span>,
      ...filterableColumn<AccountDto>('text', undefined, 'erp.columns.email'),
    },
    {
      accessorKey: 'role',
      header: renderHeader('erp.columns.role'),
      cell: ({ row }) => <RoleCell account={row.original} {...callbacks} />,
      ...filterableColumn<AccountDto>('enum', ACCOUNT_ROLE_FILTER_OPTIONS, 'erp.columns.role'),
    },
    {
      accessorKey: 'active',
      header: renderHeader('erp.columns.status'),
      cell: ({ row }) => <StatusCell account={row.original} {...callbacks} />,
      ...filterableColumn<AccountDto>('boolean', undefined, 'erp.columns.status'),
    },
    {
      id: 'profileCount',
      accessorFn: (account) => account.profiles.length,
      header: renderHeader('erp.columns.profiles'),
      cell: ({ row }) => <ProfilesCell account={row.original} {...callbacks} />,
      ...filterableColumn<AccountDto>('number', undefined, 'erp.columns.profiles'),
    },
    {
      accessorKey: 'createdAt',
      header: renderHeader('erp.columns.created'),
      cell: ({ getValue }) => <DateCell value={getValue<string>()} />,
      ...filterableColumn<AccountDto>('date', undefined, 'erp.columns.created'),
    },
  ];
}

/** Every column ships visible — the original flat table showed all six already. */
export const ACCOUNT_DEFAULT_VISIBLE_KEYS = new Set([
  'personName',
  'email',
  'role',
  'active',
  'profileCount',
  'createdAt',
]);

/** Shared by `GridCustomizationModal` (key/label) and `ExportModal` (key/label/getValue) — one declaration, not two. */
export const ACCOUNT_EXPORT_COLUMNS: ExportColumn<AccountDto>[] = [
  { key: 'personName', labelKey: 'erp.columns.person', getValue: (account) => account.personName },
  { key: 'email', labelKey: 'erp.columns.email', getValue: (account) => account.email },
  {
    key: 'role',
    labelKey: 'erp.columns.role',
    getValue: (account, { t }) => t(ROLE_LABEL[account.role]),
  },
  {
    key: 'active',
    labelKey: 'erp.columns.status',
    getValue: (account, { t }) => t(account.active ? 'erp.status.active' : 'erp.status.inactive'),
  },
  {
    key: 'profileCount',
    labelKey: 'erp.columns.profiles',
    getValue: (account) => String(account.profiles.length),
  },
  {
    key: 'createdAt',
    labelKey: 'erp.columns.created',
    getValue: (account, { locale }) => formatDateMedium(account.createdAt, locale),
  },
];

export const ACCOUNT_CUSTOMIZABLE_COLUMNS: CustomizableColumn[] = ACCOUNT_EXPORT_COLUMNS.map(
  ({ key, labelKey }) => ({
    key,
    labelKey,
    defaultVisible: ACCOUNT_DEFAULT_VISIBLE_KEYS.has(key),
  }),
);
