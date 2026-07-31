'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * Thin client boundary around next-themes so `app/layout.tsx` can stay a Server
 * Component. Without this the whole tree would have to opt into the client.
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
