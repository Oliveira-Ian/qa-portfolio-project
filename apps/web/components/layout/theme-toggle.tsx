'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

/**
 * Which icon shows is decided by CSS, not by JavaScript.
 *
 * The obvious version keeps a `mounted` flag so the server doesn't render the
 * wrong icon — but that costs an extra render on every page and leaves a hole
 * in the header until hydration. Letting the `dark:` variant swap the two icons
 * means the correct one is right from the first paint, and the label stays
 * accurate in both states without having to know the theme during render.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="text-header-foreground-muted hover:bg-white/10 hover:text-header-foreground"
      aria-label="Toggle light and dark theme"
      data-testid="header-button-theme"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      <Moon className="block dark:hidden" aria-hidden="true" />
      <Sun className="hidden dark:block" aria-hidden="true" />
    </Button>
  );
}
