import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex field-sizing-content min-h-24 w-full rounded-md border border-input bg-input-background px-3 py-2 text-[14.5px] text-foreground shadow-input transition-[border-color,box-shadow] duration-100 outline-none',
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

export { Textarea };
