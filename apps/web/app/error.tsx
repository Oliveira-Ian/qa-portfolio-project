'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center">
      <h1 className="text-2xl font-semibold text-foreground" data-testid="error-boundary-title">
        Something went wrong
      </h1>
      <p className="text-muted-foreground">An unexpected error occurred. Please try again.</p>
      <Button
        onClick={() => reset()}
        className="rounded-md bg-primary text-primary-foreground hover:bg-primary-hover"
        data-testid="error-boundary-button-retry"
      >
        Try again
      </Button>
    </div>
  );
}
