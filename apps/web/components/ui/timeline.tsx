import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  /** Already formatted — this component doesn't own date/locale formatting. */
  timestamp: string;
  icon?: LucideIcon;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

/**
 * A vertical list of dated events (an order's history, an audit trail) with
 * a connecting line and a marker per entry. Presentational only.
 */
export function Timeline({ items, className }: TimelineProps) {
  return (
    <ol className={cn('flex flex-col', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const Icon = item.icon;

        return (
          <li key={item.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
                {Icon ? (
                  <Icon className="size-4" aria-hidden="true" />
                ) : (
                  <span className="size-2 rounded-full bg-current" aria-hidden="true" />
                )}
              </span>
              {!isLast ? <div aria-hidden="true" className="my-1 w-px flex-1 bg-border" /> : null}
            </div>
            <div className={cn('min-w-0', !isLast && 'pb-6')}>
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              {item.description ? (
                <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
              ) : null}
              <p className="mt-1 text-xs text-muted-foreground">{item.timestamp}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
