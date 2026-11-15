import type { Metadata, Viewport } from 'next';
import { Archivo, JetBrains_Mono } from 'next/font/google';
import { cn } from '@/lib/utils';
import { I18nProvider } from '@/lib/i18n/provider';
import { getLocale } from '@/lib/i18n/server';
import { getMessages } from '@/lib/i18n/messages';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

/*
 * Self-hosted by next/font (the files are fetched at build time and served from
 * this origin, never from Google at runtime). Archivo is the variable font with
 * its width axis: the display style is wdth 118, and wdth 88 is the narrow cut
 * pt-BR table headers may use. JetBrains Mono is for codes, ids, documents,
 * dates, overlines and badges.
 */
const archivo = Archivo({
  subsets: ['latin', 'latin-ext'],
  axes: ['wdth'],
  variable: '--font-archivo',
  display: 'swap',
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Oliveira Platform',
    template: '%s · Oliveira',
  },
  description: 'One account for every Oliveira product.',
  icons: {
    // The SVG for browsers that take one; the PNGs and the .ico for those that do not.
    icon: [
      { url: '/brand/favicon.svg', type: 'image/svg+xml' },
      { url: '/brand/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/brand/favicon.ico', sizes: '16x16 32x32' },
    ],
    apple: [{ url: '/brand/apple-touch-icon.png', sizes: '180x180' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#12151B',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  return (
    // `data-theme="light"`: the only official theme. The dark one is reserved
    // in the tokens and has no switch.
    <html
      lang={locale}
      data-theme="light"
      className={cn(archivo.variable, jetBrainsMono.variable)}
      suppressHydrationWarning
    >
      {/* suppressHydrationWarning: some browser extensions inject an attribute
          onto <body> before React hydrates. */}
      <body className="min-h-dvh font-sans antialiased" suppressHydrationWarning>
        <I18nProvider locale={locale} messages={getMessages(locale)}>
          {children}
          <Toaster />
        </I18nProvider>
      </body>
    </html>
  );
}
