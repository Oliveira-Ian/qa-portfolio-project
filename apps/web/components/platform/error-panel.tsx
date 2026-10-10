'use client';

import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/provider';
import { cn } from '@/lib/utils';

interface ErrorPanelProps {
  error: Error & { digest?: string };
  reset: () => void;
  /**
   * `section` replaces only a page's content slot, below a layout, so the
   * global bar and the sidebar stay navigable; `screen` is the root boundary,
   * for what fails above any layout.
   */
  scope: 'section' | 'screen';
  testIdPrefix: string;
}

/**
 * An error screen should say what to do next, not just that something broke.
 * The most common cause here by far is the API not running, so that is the
 * first thing it names.
 */
export function ErrorPanel({ error, reset, scope, testIdPrefix }: ErrorPanelProps) {
  const t = useT();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-16 text-center',
        scope === 'screen'
          ? 'min-h-dvh bg-background'
          : 'rounded-lg border border-border bg-card shadow-card',
      )}
      data-testid={scope === 'screen' ? undefined : `${testIdPrefix}-boundary`}
    >
      <p className="olv-overline text-danger">{t('errors.boundary.overline')}</p>
      <h1 className="mt-3" data-testid={`${testIdPrefix}-boundary-title`}>
        {t('errors.boundary.title')}
      </h1>
      <p className="mt-3 max-w-md text-sm text-text-3">
        {error.message || t('errors.boundary.fallback')}
      </p>

      <Button
        className="mt-6"
        onClick={() => reset()}
        data-testid={`${testIdPrefix}-boundary-button-retry`}
      >
        <RotateCcw aria-hidden="true" />
        {t('errors.boundary.retry')}
      </Button>

      {error.digest ? (
        <p className="olv-data mt-6 text-xs text-text-muted">
          {t('errors.boundary.reference', { digest: error.digest })}
        </p>
      ) : null}
    </div>
  );
}
