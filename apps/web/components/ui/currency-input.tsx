'use client';

import { Input } from '@/components/ui/input';
import { formatCurrency, parseDigitsToAmount } from '@/lib/format';

interface CurrencyInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  'value' | 'onChange' | 'type'
> {
  value: number | null;
  onChange: (value: number | null) => void;
}

/**
 * A BRL amount field — same digit-shifting UX as `NumberInput`, displayed
 * with `formatCurrency` (`R$ 1.234,56`) so it always reads as money.
 */
export function CurrencyInput({ value, onChange, ...props }: CurrencyInputProps) {
  return (
    <Input
      {...props}
      inputMode="numeric"
      value={value === null ? '' : formatCurrency(value)}
      onChange={(event) => onChange(parseDigitsToAmount(event.target.value, 2))}
    />
  );
}
