import { Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { maskTime } from '@/lib/masks';
import { cn } from '@/lib/utils';

interface TimeInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  'value' | 'onChange' | 'type'
> {
  /** 24-hour `HH:mm`, e.g. `"09:30"` — `""` for empty. */
  value: string;
  onChange: (value: string) => void;
}

/** A 24-hour `HH:mm` field — typing digits alone produces the mask, no separate colon key needed. */
export function TimeInput({ value, onChange, className, ...props }: TimeInputProps) {
  return (
    <div className="relative">
      <Clock
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        {...props}
        inputMode="numeric"
        placeholder="00:00"
        value={value}
        onChange={(event) => onChange(maskTime(event.target.value))}
        className={cn('pl-9 tabular', className)}
      />
    </div>
  );
}
