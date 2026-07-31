'use client';

import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * A dashboard-scoped boundary — placed at `(dashboard)/`, below
 * `(dashboard)/layout.tsx`, so a failure inside a page (e.g. `PeoplePage`'s
 * `listPersons()` throwing when the API is down) only replaces the content
 * slot. The header, sidebar and breadcrumb (`DashboardShell`, rendered by
 * the layout) stay exactly as they were — the app's own chrome is still
 * navigable, so a reader who hit this on the People grid can still get to
 * Home or another module without a hard reload. `app/error.tsx` (the root
 * boundary) is what still catches anything above the dashboard layout
 * itself — the layout's own `getMe()` call, or the `(auth)` routes.
 */
export default function DashboardErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg border border-border bg-card px-6 py-16 text-center shadow-card"
      data-testid="dashboard-error-boundary"
    >
      <p className="eyebrow text-destructive">Something broke</p>
      <h1
        className="mt-3 font-display text-2xl font-semibold text-foreground"
        data-testid="dashboard-error-boundary-title"
      >
        This page couldn&rsquo;t load
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        {error.message ||
          'The request didn’t come back. Check that the API is running, then try again.'}
      </p>

      <Button
        className="mt-6"
        onClick={() => reset()}
        data-testid="dashboard-error-boundary-button-retry"
      >
        <RotateCcw aria-hidden="true" />
        Try again
      </Button>

      {error.digest ? (
        <p className="tabular mt-6 text-xs text-text-muted">Reference {error.digest}</p>
      ) : null}
    </div>
  );
}
