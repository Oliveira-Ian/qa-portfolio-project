import type { ReactNode } from 'react';

interface StyleguideSectionProps {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}

/** One top-level category (`Form controls`, `Overlays`, …) — a heading, an intro line, and its components. */
export function StyleguideSection({ id, title, description, children }: StyleguideSectionProps) {
  return (
    <section
      id={id}
      className="scroll-mt-20 border-t border-border pt-12 first:border-t-0 first:pt-0"
      aria-labelledby={`${id}-heading`}
    >
      <h2 id={`${id}-heading`} className="font-display text-2xl font-semibold text-foreground">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">{description}</p>
      ) : null}
      <div className="measured-rule mt-5" aria-hidden="true" />
      <div className="mt-8 flex flex-col gap-10">{children}</div>
    </section>
  );
}

interface ComponentDemoProps {
  id: string;
  title: string;
  description?: string;
  /** Right-aligned to the title — e.g. a link to the source file. */
  meta?: ReactNode;
  children: ReactNode;
  /** Extra classes on the demo surface — e.g. a lighter background for something meant to sit on `bg-muted`. */
  className?: string;
}

/** One component's own live demo, inside a category section. */
export function ComponentDemo({
  id,
  title,
  description,
  meta,
  children,
  className,
}: ComponentDemoProps) {
  return (
    <div id={id} className="scroll-mt-20">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {meta ? <div className="text-xs text-muted-foreground">{meta}</div> : null}
      </div>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      <div
        className={
          className ??
          'mt-3 rounded-lg border border-border bg-card p-6 shadow-card [&_[data-slot=popover-content]]:z-10'
        }
      >
        {children}
      </div>
    </div>
  );
}
