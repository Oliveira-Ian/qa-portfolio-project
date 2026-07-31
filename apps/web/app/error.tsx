'use client';

import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * An error screen should say what to do next, not just that something broke.
 * The most common cause here by far is the API not running, so that is the
 * first thing it names.
 */
export default function ErrorBoundary({
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
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-16 text-center">
      <p className="eyebrow text-destructive">Something broke</p>
      <h1
        className="mt-3 font-display text-2xl font-semibold text-foreground"
        data-testid="error-boundary-title"
      >
        This page couldn&rsquo;t load
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        {error.message ||
          'The request didn’t come back. Check that the API is running, then try again.'}
      </p>

      <Button className="mt-6" onClick={() => reset()} data-testid="error-boundary-button-retry">
        <RotateCcw aria-hidden="true" />
        Try again
      </Button>

      {error.digest ? (
        <p className="tabular mt-6 text-xs text-text-muted">Reference {error.digest}</p>
      ) : null}
    </div>
  );
}
