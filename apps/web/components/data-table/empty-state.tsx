import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

/**
 * The message a `DataTable` renders in place of its rows when there's
 * nothing to show — no illustration, just a title, a short description and
 * an optional primary action (usually "Add the first …").
 */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="font-display text-lg font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
