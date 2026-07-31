'use client';

import type { ColumnDef, HeaderContext } from '@tanstack/react-table';
import type { ProfileDto } from '@oliveira/schemas';
import type { CustomizableColumn } from '@/components/data-table/grid-customization-modal';
import type { ExportColumn } from '@/components/data-table/export-modal';
import { ColumnFilter } from '@/components/data-table/column-filter';
import { ColumnHeader } from '@/components/data-table/column-header';
import { filterableColumn } from '@/components/data-table/column-helpers';
import { Badge } from '@/components/ui/badge';

/** Sort/filter trigger for a column header — every data column composes the same pair. */
function renderHeader(label: string) {
  return function ProfileColumnHeader({ column }: HeaderContext<ProfileDto, unknown>) {
    return (
      <div className="flex items-center gap-1">
        <ColumnHeader
          column={column}
          label={label}
          testId={`profile-list-column-header-${column.id}`}
        />
        <ColumnFilter column={column} label={label} testIdPrefix="profile-list" />
      </div>
    );
  };
}

function FlagBadge({ active, label }: { active: boolean; label: string }) {
  if (!active) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <Badge variant="outline" className="eyebrow border-primary/40 text-primary">
      {label}
    </Badge>
  );
}

/**
 * The data columns for the Perfis grid — the only Profile-specific piece of
 * the listing. Structural concerns (selection, sorting, filtering,
 * pagination) all come from `components/data-table/`; this file only
 * declares which fields exist and how each renders and filters.
 *
 * `isDefault`/`isSystem` are two independent columns rather than one merged
 * "Flags" display — each is its own boolean, filterable on its own, matching
 * how every other data-table column here works (one concern per column).
 */
export const profileColumns: ColumnDef<ProfileDto>[] = [
  {
    accessorKey: 'name',
    header: renderHeader('Name'),
    cell: ({ getValue }) => (
      <span className="font-medium text-foreground">{getValue<string>()}</span>
    ),
    ...filterableColumn<ProfileDto>('text'),
  },
  {
    accessorKey: 'description',
    header: renderHeader('Description'),
    cell: ({ getValue }) => (
      <span className="block max-w-xs truncate text-muted-foreground">
        {getValue<string | null>() ?? '—'}
      </span>
    ),
    ...filterableColumn<ProfileDto>('text'),
  },
  {
    id: 'permissionCount',
    accessorFn: (profile) => profile.permissions.length,
    header: renderHeader('Permissions'),
    cell: ({ getValue }) => (
      <span className="tabular text-muted-foreground">{getValue<number>()}</span>
    ),
    ...filterableColumn<ProfileDto>('number'),
  },
  {
    accessorKey: 'isDefault',
    header: renderHeader('Default'),
    cell: ({ getValue }) => <FlagBadge active={getValue<boolean>()} label="Default" />,
    ...filterableColumn<ProfileDto>('boolean'),
  },
  {
    accessorKey: 'isSystem',
    header: renderHeader('System'),
    cell: ({ getValue }) => <FlagBadge active={getValue<boolean>()} label="System" />,
    ...filterableColumn<ProfileDto>('boolean'),
  },
];

/** Every column ships visible — the original flat table showed all five concepts already. */
export const PROFILE_DEFAULT_VISIBLE_KEYS = new Set([
  'name',
  'description',
  'permissionCount',
  'isDefault',
  'isSystem',
]);

/** Shared by `GridCustomizationModal` (key/label) and `ExportModal` (key/label/getValue) — one declaration, not two. */
export const PROFILE_EXPORT_COLUMNS: ExportColumn<ProfileDto>[] = [
  { key: 'name', label: 'Name', getValue: (profile) => profile.name },
  { key: 'description', label: 'Description', getValue: (profile) => profile.description ?? '' },
  {
    key: 'permissionCount',
    label: 'Permissions',
    getValue: (profile) => String(profile.permissions.length),
  },
  { key: 'isDefault', label: 'Default', getValue: (profile) => (profile.isDefault ? 'Yes' : 'No') },
  { key: 'isSystem', label: 'System', getValue: (profile) => (profile.isSystem ? 'Yes' : 'No') },
];

export const PROFILE_CUSTOMIZABLE_COLUMNS: CustomizableColumn[] = PROFILE_EXPORT_COLUMNS.map(
  ({ key, label }) => ({ key, label, defaultVisible: PROFILE_DEFAULT_VISIBLE_KEYS.has(key) }),
);
