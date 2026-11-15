'use client';

import type { ColumnDef, HeaderContext } from '@tanstack/react-table';
import type { ProfileDto } from '@oliveira/schemas';
import type { CustomizableColumn } from '@/components/data-table/grid-customization-modal';
import type { ExportColumn } from '@/components/data-table/export-modal';
import { ColumnFilter } from '@/components/data-table/column-filter';
import { ColumnHeader } from '@/components/data-table/column-header';
import { filterableColumn } from '@/components/data-table/column-helpers';
import { Badge } from '@/components/ui/badge';
import { useT } from '@/lib/i18n/provider';
import type { MessageKey } from '@/lib/i18n/translate';

/** Sort/filter trigger for a column header — every data column composes the same pair. */
function renderHeader(labelKey: MessageKey) {
  return function ProfileColumnHeader({ column }: HeaderContext<ProfileDto, unknown>) {
    const t = useT();
    const label = t(labelKey);

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

/** Default / System are marks on the profile — tags, not states. */
function FlagBadge({ active, labelKey }: { active: boolean; labelKey: MessageKey }) {
  const t = useT();

  if (!active) {
    return <span className="text-text-3">—</span>;
  }

  return <Badge variant="default">{t(labelKey)}</Badge>;
}

/**
 * The data columns for the access-profiles grid — the only Profile-specific piece
 * of the listing. Structural concerns (selection, sorting, filtering,
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
    header: renderHeader('erp.columns.name'),
    cell: ({ getValue }) => (
      <span className="font-medium text-foreground">{getValue<string>()}</span>
    ),
    ...filterableColumn<ProfileDto>('text', undefined, 'erp.columns.name'),
  },
  {
    accessorKey: 'description',
    header: renderHeader('erp.columns.description'),
    cell: ({ getValue }) => (
      <span className="block max-w-xs truncate text-text-2">
        {getValue<string | null>() ?? '—'}
      </span>
    ),
    ...filterableColumn<ProfileDto>('text', undefined, 'erp.columns.description'),
  },
  {
    id: 'permissionCount',
    accessorFn: (profile) => profile.permissions.length,
    header: renderHeader('erp.columns.permissions'),
    cell: ({ getValue }) => (
      <span className="olv-data tabular text-text-2">{getValue<number>()}</span>
    ),
    ...filterableColumn<ProfileDto>('number', undefined, 'erp.columns.permissions'),
  },
  {
    accessorKey: 'isDefault',
    header: renderHeader('erp.columns.default'),
    cell: ({ getValue }) => (
      <FlagBadge active={getValue<boolean>()} labelKey="erp.columns.default" />
    ),
    ...filterableColumn<ProfileDto>('boolean', undefined, 'erp.columns.default'),
  },
  {
    accessorKey: 'isSystem',
    header: renderHeader('erp.columns.system'),
    cell: ({ getValue }) => (
      <FlagBadge active={getValue<boolean>()} labelKey="erp.columns.system" />
    ),
    ...filterableColumn<ProfileDto>('boolean', undefined, 'erp.columns.system'),
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
  { key: 'name', labelKey: 'erp.columns.name', getValue: (profile) => profile.name },
  {
    key: 'description',
    labelKey: 'erp.columns.description',
    getValue: (profile) => profile.description ?? '',
  },
  {
    key: 'permissionCount',
    labelKey: 'erp.columns.permissions',
    getValue: (profile) => String(profile.permissions.length),
  },
  {
    key: 'isDefault',
    labelKey: 'erp.columns.default',
    getValue: (profile, { t }) => t(profile.isDefault ? 'table.filters.yes' : 'table.filters.no'),
  },
  {
    key: 'isSystem',
    labelKey: 'erp.columns.system',
    getValue: (profile, { t }) => t(profile.isSystem ? 'table.filters.yes' : 'table.filters.no'),
  },
];

export const PROFILE_CUSTOMIZABLE_COLUMNS: CustomizableColumn[] = PROFILE_EXPORT_COLUMNS.map(
  ({ key, labelKey }) => ({
    key,
    labelKey,
    defaultVisible: PROFILE_DEFAULT_VISIBLE_KEYS.has(key),
  }),
);
