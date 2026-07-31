import * as React from 'react';
import { Input } from '@/components/ui/input';

interface MaskedInputProps extends Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  /** A pure formatter, e.g. `maskPhone`/`maskDocument` from `lib/masks.ts`. */
  mask: (value: string) => string;
}

/**
 * An `Input` whose every keystroke is reshaped by `mask` before it reaches
 * `onChange` — the pattern `person-form-fields.tsx` wrote by hand for the
 * document and phone fields, generalized so the next masked field doesn't
 * repeat it.
 */
export function MaskedInput({ value, onChange, mask, ...props }: MaskedInputProps) {
  return (
    <Input {...props} value={value} onChange={(event) => onChange(mask(event.target.value))} />
  );
}
