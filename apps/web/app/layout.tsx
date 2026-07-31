import type { Metadata, Viewport } from 'next';
import { Archivo, IBM_Plex_Mono, Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
});

// Only the weights the data columns actually use — every extra weight is
// another font file on the critical path.
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Oliveira ERP',
    template: '%s · Oliveira ERP',
  },
  description: 'Registry and back office for a construction company.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f1ec' },
    { media: '(prefers-color-scheme: dark)', color: '#0e1512' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // next-themes writes the theme class onto <html> before paint, which the
    // server can't know about — this is the one place the warning is expected.
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(inter.variable, archivo.variable, plexMono.variable)}
    >
      {/* suppressHydrationWarning here too: some browser extensions inject an
          attribute onto <body> before React hydrates, which is the other
          documented cause of this warning besides the theme class above. */}
      <body className="min-h-dvh font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
