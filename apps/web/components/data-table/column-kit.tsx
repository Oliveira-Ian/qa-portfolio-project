'use client';

import type { HeaderContext } from '@tanstack/react-table';
import { StatusBadge } from '@/components/ui/badge';
import { formatDateMedium } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n/provider';
import type { MessageKey } from '@/lib/i18n/translate';
import { ColumnFilter } from './column-filter';
import { ColumnHeader } from './column-header';
import type { ExportColumn } from './export-modal';
import type { CustomizableColumn } from './grid-customization-modal';

/**
 * The pieces every listing's column file repeats: the header with its sort
 * and quick filter, the cells for a date, a code and an active flag, and the
 * customizable columns derived from the export ones.
 */
export function columnHeader<TRow>(labelKey: MessageKey, testIdPrefix: string) {
  return function ListColumnHeader({ column }: HeaderContext<TRow, unknown>) {
    const t = useT();
    const label = t(labelKey);

    return (
      <div className="flex items-center gap-1">
        <ColumnHeader
          column={column}
          label={label}
          testId={`${testIdPrefix}-column-header-${column.id}`}
        />
        <ColumnFilter column={column} label={label} testIdPrefix={testIdPrefix} />
      </div>
    );
  };
}

/** A date in the interface language, mono — the design's number-and-date style. */
export function DateCell({ value }: { value: string | null }) {
  const locale = useLocale();

  return value ? (
    <span className="olv-data tabular text-text-2">{formatDateMedium(value, locale)}</span>
  ) : (
    <span className="text-text-3">—</span>
  );
}

/** Codes, documents, phone numbers: mono, never translated. */
export function MonoCell({ value }: { value: string | null }) {
  return (
    <span className="olv-data tabular text-text-2" translate="no">
      {value ?? '—'}
    </span>
  );
}

export function NameCell({ value, sub }: { value: string; sub?: string | null }) {
  return (
    <span className="block max-w-[20rem] truncate">
      <span className="font-medium text-foreground">{value}</span>
      {sub ? <span className="block truncate text-xs text-text-3">{sub}</span> : null}
    </span>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  const t = useT();

  return (
    <StatusBadge tone={active ? 'success' : 'neutral'}>
      {t(active ? 'common.active' : 'common.inactive')}
    </StatusBadge>
  );
}

export function customizableColumns<TRow>(
  exportColumns: ExportColumn<TRow>[],
  visibleByDefault: readonly string[],
): CustomizableColumn[] {
  return exportColumns.map(({ key, labelKey }) => ({
    key,
    labelKey,
    defaultVisible: visibleByDefault.includes(key),
  }));
}
