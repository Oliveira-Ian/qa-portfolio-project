'use client';

import { useState } from 'react';
import { DatePicker } from '@/components/ui/date-picker';
import { TimeInput } from '@/components/ui/time-input';
import { cn } from '@/lib/utils';

interface DateTimeFieldProps {
  /** `yyyy-mm-ddThh:mm`, or `''` for none — what `<input type="datetime-local">` holds. */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  datePlaceholder?: string;
  timeLabel: string;
  className?: string;
  'data-testid'?: string;
}

const COMPLETE_TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * A date and a time in one value: the design system's `DatePicker` and
 * `TimeInput` side by side. Picking a date with no time yet sets 08:00; the
 * time is kept as typed until it is a whole `HH:mm`; clearing the date clears
 * the value.
 */
export function DateTimeField({
  value,
  onChange,
  disabled = false,
  datePlaceholder,
  timeLabel,
  className,
  'data-testid': testId,
}: DateTimeFieldProps) {
  const [date = '', time = ''] = value ? value.split('T') : [];
  // What is being typed in the time box, until it is a whole time.
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <div className={cn('grid grid-cols-[minmax(0,1fr)_7rem] gap-2', className)}>
      <DatePicker
        value={date}
        onChange={(next) => {
          setDraft(null);
          onChange(next ? `${next}T${time || '08:00'}` : '');
        }}
        disabled={disabled}
        {...(datePlaceholder ? { placeholder: datePlaceholder } : {})}
        {...(testId ? { 'data-testid': `${testId}-date` } : {})}
      />
      <TimeInput
        value={draft ?? time}
        onChange={(next) => {
          if (COMPLETE_TIME.test(next)) {
            setDraft(null);
            onChange(`${date}T${next}`);
          } else {
            setDraft(next);
          }
        }}
        onBlur={() => setDraft(null)}
        disabled={disabled || !date}
        aria-label={timeLabel}
        {...(testId ? { 'data-testid': `${testId}-time` } : {})}
      />
    </div>
  );
}
