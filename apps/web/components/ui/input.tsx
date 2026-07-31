import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Carries the token styling itself (`rounded-md`, `shadow-input`, the input
 * background) so call sites don't have to repeat it — they used to, and a
 * missed class meant one field silently looked different from its neighbours.
 */
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-10 w-full min-w-0 rounded-md border border-input bg-input-background px-3 py-2 text-sm text-foreground shadow-input transition-[border-color,box-shadow] outline-none',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
        'placeholder:text-text-muted',
        'hover:border-border-hover',
        'focus-visible:border-border-focus focus-visible:ring-3 focus-visible:ring-ring/30',
        'disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-70',
        'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
