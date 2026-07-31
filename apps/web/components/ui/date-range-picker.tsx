'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDate, parseIsoDate, toIsoDate } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface DateRangeValue {
  /** ISO calendar days (`yyyy-MM-dd`), or `""` for an unset end. */
  from: string;
  to: string;
}

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  'data-testid'?: string;
}

function toSelected(value: DateRangeValue): DateRange | undefined {
  const from = value.from ? parseIsoDate(value.from) : undefined;

  if (!from) {
    return undefined;
  }

  return { from, to: value.to ? parseIsoDate(value.to) : undefined };
}

/**
 * The two-month `DateRangePicker` sibling of `DatePicker` — same `yyyy-MM-dd`
 * string convention, one for each end. Closes itself once both ends are
 * picked; a single date with no end stays open so the second click can land.
 */
export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Select a date range…',
  disabled,
  className,
  ...props
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = toSelected(value);

  const label = selected
    ? selected.to
      ? `${formatDate(value.from)} – ${formatDate(value.to)}`
      : formatDate(value.from)
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start font-normal',
            !selected && 'text-muted-foreground',
            className,
          )}
          {...props}
        >
          <CalendarIcon aria-hidden="true" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="range"
          numberOfMonths={2}
          selected={selected}
          // `toSelected` never returns a `DateRange` with an unset `from`.
          {...(selected ? { defaultMonth: selected.from! } : {})}
          onSelect={(range) => {
            onChange({
              from: range?.from ? toIsoDate(range.from) : '',
              to: range?.to ? toIsoDate(range.to) : '',
            });

            if (range?.from && range?.to) {
              setOpen(false);
            }
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
