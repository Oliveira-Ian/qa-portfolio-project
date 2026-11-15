'use client';

import { useCallback } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useT } from '@/lib/i18n/provider';
import type { DateRangeFilterValue, NumberRangeFilterValue } from './filter-fns';
import { filterOptionLabel, type FilterOption, type FilterType } from './types';

interface FilterFieldProps {
  filterType: FilterType;
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
  options?: FilterOption[] | undefined;
  /**
   * How an `enum` field shows its options: every checkbox laid out (the column's
   * own popover), or a multi-select dropdown whose choices become removable
   * chips — the filter panel's, where a long list of checkboxes would push
   * everything else down.
   */
  enumControl?: 'checkboxes' | 'multi-select' | undefined;
  /** Options searched on the server — always a multi-select; `options` then names the chosen ones. */
  loadOptions?: ((search: string) => Promise<FilterOption[]>) | undefined;
  testId: string;
}

/**
 * Renders the widget for one filterable field, picked from its declared
 * `filterType` — shared by `ColumnFilter`'s popover (one field at a time)
 * and `FilterDrawer` (every filterable field of the routine at once), so
 * the two never drift into different behaviour for the same column.
 */
export function FilterField({
  filterType,
  label,
  value,
  onChange,
  options,
  enumControl = 'checkboxes',
  loadOptions,
  testId,
}: FilterFieldProps) {
  const t = useT();
  // Stable while `loadOptions` is, so the multi-select doesn't search again on every render.
  const searchOptions = useCallback(
    async (search: string) =>
      (loadOptions ? await loadOptions(search) : []).map((option) => ({
        value: option.value,
        label: filterOptionLabel(option, t),
      })),
    [loadOptions, t],
  );

  if (filterType === 'text') {
    return (
      <div className="space-y-1.5">
        <Label>{label}</Label>
        <Input
          value={(value as string | undefined) ?? ''}
          onChange={(event) => onChange(event.target.value === '' ? undefined : event.target.value)}
          data-testid={testId}
        />
      </div>
    );
  }

  if (filterType === 'boolean') {
    const current = (value as string | undefined) ?? 'any';

    return (
      <div className="space-y-1.5">
        <Label>{label}</Label>
        <Select
          value={current}
          onValueChange={(next) => onChange(next === 'any' ? undefined : next)}
        >
          <SelectTrigger className="w-full" aria-label={label} data-testid={testId}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">{t('table.filters.any')}</SelectItem>
            <SelectItem value="true">{t('table.filters.yes')}</SelectItem>
            <SelectItem value="false">{t('table.filters.no')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (filterType === 'enum') {
    const selected = (value as string[] | undefined) ?? [];

    if (enumControl === 'multi-select' || loadOptions) {
      const toMultiSelectOptions = (list: FilterOption[]) =>
        list.map((option) => ({ value: option.value, label: filterOptionLabel(option, t) }));

      return (
        <div className="space-y-1.5">
          <Label>{label}</Label>
          <MultiSelect
            aria-label={label}
            options={toMultiSelectOptions(options ?? [])}
            {...(loadOptions ? { loadOptions: searchOptions } : {})}
            value={selected}
            onChange={(next) => onChange(next.length > 0 ? next : undefined)}
            placeholder={t('table.filters.any')}
            data-testid={testId}
          />
        </div>
      );
    }

    return (
      <div className="space-y-1.5">
        <Label>{label}</Label>
        <div className="space-y-1.5" data-testid={testId}>
          {(options ?? []).map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox
                checked={selected.includes(option.value)}
                onCheckedChange={(checked) => {
                  const next =
                    checked === true
                      ? [...selected, option.value]
                      : selected.filter((value_) => value_ !== option.value);
                  onChange(next.length > 0 ? next : undefined);
                }}
              />
              {filterOptionLabel(option, t)}
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (filterType === 'date') {
    const current = (value as DateRangeFilterValue | undefined) ?? {};

    function emitDateRange(next: DateRangeFilterValue) {
      onChange(next.from || next.to ? next : undefined);
    }

    return (
      <div className="space-y-1.5">
        <Label>{label}</Label>
        <div className="flex items-center gap-2" data-testid={testId}>
          <Input
            type="date"
            aria-label={t('table.filters.from', { label })}
            value={current.from ?? ''}
            onChange={(event) =>
              emitDateRange({ ...current, from: event.target.value || undefined })
            }
          />
          <span aria-hidden="true" className="text-text-3">
            –
          </span>
          <Input
            type="date"
            aria-label={t('table.filters.to', { label })}
            value={current.to ?? ''}
            onChange={(event) => emitDateRange({ ...current, to: event.target.value || undefined })}
          />
        </div>
      </div>
    );
  }

  const current = (value as NumberRangeFilterValue | undefined) ?? {};

  function emitNumberRange(next: NumberRangeFilterValue) {
    onChange(next.min !== undefined || next.max !== undefined ? next : undefined);
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2" data-testid={testId}>
        <Input
          type="number"
          placeholder={t('table.filters.min')}
          aria-label={t('table.filters.minimum', { label })}
          value={current.min ?? ''}
          onChange={(event) =>
            emitNumberRange({
              ...current,
              min: event.target.value === '' ? undefined : Number(event.target.value),
            })
          }
        />
        <span aria-hidden="true" className="text-text-3">
          –
        </span>
        <Input
          type="number"
          placeholder={t('table.filters.max')}
          aria-label={t('table.filters.maximum', { label })}
          value={current.max ?? ''}
          onChange={(event) =>
            emitNumberRange({
              ...current,
              max: event.target.value === '' ? undefined : Number(event.target.value),
            })
          }
        />
      </div>
    </div>
  );
}
