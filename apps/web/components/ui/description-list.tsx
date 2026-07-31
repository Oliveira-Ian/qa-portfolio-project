import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface DescriptionListItem {
  label: string;
  value: ReactNode;
  /** e.g. `'sm:col-span-2'` for a value that needs the full row. */
  className?: string;
}

interface DescriptionListProps {
  items: DescriptionListItem[];
  className?: string;
}

/**
 * A label/value grid for a read-only record — the plain alternative to
 * reusing an entity's edit form in `disabled` mode, for a screen that has no
 * form to disable in the first place.
 */
export function DescriptionList({ items, className }: DescriptionListProps) {
  return (
    <dl className={cn('grid gap-5 sm:grid-cols-2', className)}>
      {items.map((item) => (
        <div key={item.label} className={item.className}>
          <dt className="text-sm text-muted-foreground">{item.label}</dt>
          <dd className="mt-1 text-sm font-medium text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
