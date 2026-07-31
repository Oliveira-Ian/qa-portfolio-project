import { cn } from '@/lib/utils';

interface PageHeaderProps {
  /** The section this page belongs to — the drawing-label above the title. */
  eyebrow: string;
  title: string;
  description?: string;
  /** Primary actions, aligned to the trailing edge. */
  actions?: React.ReactNode;
  titleTestId?: string;
  className?: string;
  /** Rendered below the measured rule — e.g. a listing screen's record count. */
  meta?: React.ReactNode;
}

/**
 * Every page opens the same way: section label, title, then the measured rule
 * that closes the header. Repeating the device is what makes it read as
 * structure rather than decoration — it always marks the same boundary.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  titleTestId,
  className,
  meta,
}: PageHeaderProps) {
  return (
    <header className={cn('mb-6', className)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow text-primary">{eyebrow}</p>
          <h1
            className="mt-1.5 text-2xl font-semibold text-foreground sm:text-[1.75rem]"
            data-testid={titleTestId}
          >
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 max-w-prose text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>

        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>

      <div className="measured-rule mt-5" aria-hidden="true" />

      {meta}
    </header>
  );
}
