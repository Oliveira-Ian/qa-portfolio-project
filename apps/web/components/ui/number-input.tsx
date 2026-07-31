'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { LOCALE, parseDigitsToAmount } from '@/lib/format';

interface NumberInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  'value' | 'onChange' | 'type'
> {
  value: number | null;
  onChange: (value: number | null) => void;
  /** Fixed decimal places the typed digits shift into — 0 (default) for a plain integer quantity, 2 for money. */
  decimalScale?: number;
}

/**
 * A numeric input where every keystroke is a digit of the amount, not a
 * literal character to place a decimal point around — the same UX
 * `CurrencyInput` uses underneath its `R$` formatting. `decimalScale=0`
 * makes it a thousands-separated integer field (stock quantity, a count).
 */
export function NumberInput({ value, onChange, decimalScale = 0, ...props }: NumberInputProps) {
  const formatter = React.useMemo(
    () =>
      new Intl.NumberFormat(LOCALE, {
        minimumFractionDigits: decimalScale,
        maximumFractionDigits: decimalScale,
      }),
    [decimalScale],
  );

  return (
    <Input
      {...props}
      inputMode="numeric"
      value={value === null ? '' : formatter.format(value)}
      onChange={(event) => onChange(parseDigitsToAmount(event.target.value, decimalScale))}
    />
  );
}
