import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Destructive-soft · secondary · primary, aligned to the trailing edge (handoff § 5). */
  actions?: React.ReactNode;
  titleTestId?: string;
  className?: string;
  /** The mono line under the title — a count, a selection, a state ("12 members · 2 pending"). */
  meta?: React.ReactNode;
}

/**
 * Every page opens the same way (handoff § 5): the H1, its mono meta line, and
 * the actions on the right. The breadcrumb above it is the shell's, not the
 * page's. On a narrow screen the actions wrap under the title.
 */
export function PageHeader({
  title,
  description,
  actions,
  titleTestId,
  className,
  meta,
}: PageHeaderProps) {
  return (
    <header className={cn('mb-6', className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h1 className="truncate text-foreground" data-testid={titleTestId}>
            {title}
          </h1>
          {meta ? <div className="olv-overline mt-1.5 text-text-3">{meta}</div> : null}
          {description ? (
            <p className="mt-2 max-w-prose text-sm text-text-3">{description}</p>
          ) : null}
        </div>

        {actions ? (
          <div className="flex max-w-full flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
