import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * The design's text input: 40px (44 on auth and mobile), a 1px control border
 * that stays ≥ 3:1 on white, navy border + 3px ring on focus (navy in every
 * product — focus is Platform-owned), and an error state carried by
 * `aria-invalid` (the message, with its icon, replaces the help text).
 *
 * It carries the token styling itself so call sites don't have to repeat it —
 * they used to, and a missed class meant one field silently looked different
 * from its neighbours.
 */
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-10 w-full min-w-0 rounded-md border border-input bg-input-background px-3 text-[14.5px] text-foreground shadow-input transition-[border-color,box-shadow] duration-100 outline-none',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
        'placeholder:text-text-muted',
        'hover:border-input-hover',
        'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/16',
        'read-only:border-border read-only:bg-surface-2 read-only:text-text-2 read-only:shadow-none',
        'disabled:cursor-not-allowed disabled:border-border disabled:bg-background disabled:text-text-muted disabled:shadow-none',
        'aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/16',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
