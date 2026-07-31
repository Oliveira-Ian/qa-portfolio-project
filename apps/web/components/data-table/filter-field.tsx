'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DateRangeFilterValue, NumberRangeFilterValue } from './filter-fns';
import type { FilterOption, FilterType } from './types';

interface FilterFieldProps {
  filterType: FilterType;
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
  options?: FilterOption[] | undefined;
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
  testId,
}: FilterFieldProps) {
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
          <SelectTrigger className="w-full" data-testid={testId}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="true">Yes</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (filterType === 'enum') {
    const selected = (value as string[] | undefined) ?? [];

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
              {option.label}
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
            aria-label={`${label} from`}
            value={current.from ?? ''}
            onChange={(event) =>
              emitDateRange({ ...current, from: event.target.value || undefined })
            }
          />
          <span aria-hidden="true" className="text-muted-foreground">
            –
          </span>
          <Input
            type="date"
            aria-label={`${label} to`}
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
          placeholder="Min"
          aria-label={`${label} minimum`}
          value={current.min ?? ''}
          onChange={(event) =>
            emitNumberRange({
              ...current,
              min: event.target.value === '' ? undefined : Number(event.target.value),
            })
          }
        />
        <span aria-hidden="true" className="text-muted-foreground">
          –
        </span>
        <Input
          type="number"
          placeholder="Max"
          aria-label={`${label} maximum`}
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
