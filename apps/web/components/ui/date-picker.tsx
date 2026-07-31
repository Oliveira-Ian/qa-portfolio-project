'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDate, parseIsoDate, toIsoDate } from '@/lib/format';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  /** ISO calendar day (`yyyy-MM-dd`), or `""` for none. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  'data-testid'?: string;
}

/**
 * A `Popover` + `Calendar` bound to the same `yyyy-MM-dd` string an
 * `<input type="date">` produces — a drop-in replacement wherever a form
 * field already stores a date that way (e.g. `PersonFormValues.birthdate`),
 * with a consistent-with-the-rest-of-the-app display via `formatDate`.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = 'Select a date…',
  disabled,
  className,
  ...props
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = value ? parseIsoDate(value) : undefined;

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
          {selected ? formatDate(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          {...(selected ? { defaultMonth: selected } : {})}
          onSelect={(date) => {
            onChange(date ? toIsoDate(date) : '');
            setOpen(false);
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
