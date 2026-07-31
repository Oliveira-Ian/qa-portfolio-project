'use client';

import type { ColumnDef, HeaderContext } from '@tanstack/react-table';
import { ShieldCheck } from 'lucide-react';
import type { AccountDto, AccountRole } from '@oliveira/schemas';
import { ColumnFilter } from '@/components/data-table/column-filter';
import { ColumnHeader } from '@/components/data-table/column-header';
import { filterableColumn } from '@/components/data-table/column-helpers';
import type { CustomizableColumn } from '@/components/data-table/grid-customization-modal';
import type { ExportColumn } from '@/components/data-table/export-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate } from '@/lib/format';

/**
 * `SYSTEM` is deliberately not offered here — it's a reserved role for
 * integrations, assigned by seed data, not something an admin hand-picks for
 * a person's account. See `docs/product/access_control.md`.
 */
export const ACCOUNT_ROLE_OPTIONS: { label: string; value: string }[] = [
  { label: 'Admin', value: 'ADMIN' },
  { label: 'User', value: 'USER' },
];

/** Every role a `SYSTEM` account can still be filtered by, even though it can't be hand-assigned. */
const ACCOUNT_ROLE_FILTER_OPTIONS = [...ACCOUNT_ROLE_OPTIONS, { label: 'System', value: 'SYSTEM' }];

function renderHeader(label: string) {
  return function AccountColumnHeader({ column }: HeaderContext<AccountDto, unknown>) {
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
  isPending: boolean;
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
  isPending,
}: AccountColumnCallbacks): ColumnDef<AccountDto>[] {
  return [
    {
      accessorKey: 'personName',
      header: renderHeader('Person'),
      cell: ({ getValue }) => (
        <span className="font-medium text-foreground">{getValue<string>()}</span>
      ),
      ...filterableColumn<AccountDto>('text'),
    },
    {
      accessorKey: 'email',
      header: renderHeader('Email'),
      cell: ({ getValue }) => <span className="text-muted-foreground">{getValue<string>()}</span>,
      ...filterableColumn<AccountDto>('text'),
    },
    {
      accessorKey: 'role',
      header: renderHeader('Role'),
      cell: ({ row }) => {
        const account = row.original;

        if (account.role === 'SYSTEM') {
          return (
            <Badge variant="outline" className="eyebrow border-border text-muted-foreground">
              System
            </Badge>
          );
        }

        return (
          <Select
            value={account.role}
            disabled={isPending}
            onValueChange={(role: AccountRole) => onRoleChange(account, role)}
          >
            <SelectTrigger className="w-28" data-testid="account-list-select-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACCOUNT_ROLE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      },
      ...filterableColumn<AccountDto>('enum', ACCOUNT_ROLE_FILTER_OPTIONS),
    },
    {
      accessorKey: 'active',
      header: renderHeader('Status'),
      cell: ({ row }) => {
        const account = row.original;

        return (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending || account.role === 'SYSTEM'}
            data-testid="account-list-button-toggle-active"
            onClick={() => onToggleActive(account)}
          >
            <Badge
              variant="outline"
              className={
                account.active
                  ? 'eyebrow border-toast-success/40 bg-toast-success/10 text-toast-success'
                  : 'eyebrow border-border bg-muted text-muted-foreground'
              }
            >
              {account.active ? 'Active' : 'Inactive'}
            </Badge>
          </Button>
        );
      },
      ...filterableColumn<AccountDto>('boolean'),
    },
    {
      id: 'profileCount',
      accessorFn: (account) => account.profiles.length,
      header: renderHeader('Profiles'),
      cell: ({ row }) => {
        const account = row.original;

        return (
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="account-list-button-manage-profiles"
            onClick={() => onManageProfiles(account)}
          >
            <ShieldCheck aria-hidden="true" />
            {account.profiles.length === 0
              ? 'No profiles'
              : `${account.profiles.length} profile${account.profiles.length === 1 ? '' : 's'}`}
          </Button>
        );
      },
      ...filterableColumn<AccountDto>('number'),
    },
    {
      accessorKey: 'createdAt',
      header: renderHeader('Created'),
      cell: ({ getValue }) => (
        <span className="tabular text-sm text-muted-foreground">
          {formatDate(getValue<string>())}
        </span>
      ),
      ...filterableColumn<AccountDto>('date'),
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
  { key: 'personName', label: 'Person', getValue: (account) => account.personName },
  { key: 'email', label: 'Email', getValue: (account) => account.email },
  { key: 'role', label: 'Role', getValue: (account) => account.role },
  {
    key: 'active',
    label: 'Status',
    getValue: (account) => (account.active ? 'Active' : 'Inactive'),
  },
  {
    key: 'profileCount',
    label: 'Profiles',
    getValue: (account) => String(account.profiles.length),
  },
  { key: 'createdAt', label: 'Created', getValue: (account) => formatDate(account.createdAt) },
];

export const ACCOUNT_CUSTOMIZABLE_COLUMNS: CustomizableColumn[] = ACCOUNT_EXPORT_COLUMNS.map(
  ({ key, label }) => ({ key, label, defaultVisible: ACCOUNT_DEFAULT_VISIBLE_KEYS.has(key) }),
);
