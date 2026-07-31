import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PersonStatusBadge, PersonTypeBadge } from '@/components/people/person-badges';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export const metadata: Metadata = {
  title: 'Design system',
};

const SWATCHES = [
  { name: 'Ink', token: 'bg-header', note: 'Chrome, headings' },
  { name: 'Olive', token: 'bg-primary', note: 'Primary action' },
  { name: 'Amber', token: 'bg-signal', note: 'Signal, marks' },
  { name: 'Clay', token: 'bg-destructive', note: 'Destructive' },
  { name: 'Limestone', token: 'bg-background', note: 'Page ground' },
  { name: 'Paper', token: 'bg-card', note: 'Surfaces' },
];

/**
 * A live reference for the Olival tokens — moved off `/` so the root can be the
 * product's front door. Every value here comes from `docs/design/tokens.md`.
 */
export default function StyleguidePage() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-5xl px-6 py-12" data-testid="styleguide-page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-primary">Olival</p>
          <h1 className="mt-1.5 text-3xl font-semibold text-foreground">Design system</h1>
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">
            Palette taken from the mark and the site photograph: olive foliage, ink, and the amber
            of a safety vest on limestone.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="outline" data-testid="styleguide-link-home">
            <Link href="/">
              <ArrowLeft aria-hidden="true" />
              Back
            </Link>
          </Button>
        </div>
      </div>

      <div className="measured-rule mt-6" aria-hidden="true" />

      <section className="mt-10" aria-labelledby="palette-heading">
        <h2 id="palette-heading" className="text-lg font-semibold">
          Palette
        </h2>
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {SWATCHES.map((swatch) => (
            <li key={swatch.name}>
              <div
                className={`h-16 rounded-md border border-border ${swatch.token}`}
                aria-hidden="true"
              />
              <p className="mt-2 text-sm font-medium text-foreground">{swatch.name}</p>
              <p className="text-xs text-muted-foreground">{swatch.note}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12" aria-labelledby="type-heading">
        <h2 id="type-heading" className="text-lg font-semibold">
          Typography
        </h2>
        <div className="mt-4 space-y-4 rounded-lg border border-border bg-card p-6 shadow-card">
          <p className="eyebrow text-primary">Eyebrow · Archivo</p>
          <p className="font-display text-3xl font-semibold tracking-tight">
            Display headings set in Archivo
          </p>
          <p className="max-w-prose text-sm text-muted-foreground">
            Interface copy runs in Inter, sized for long sessions rather than for a screenshot.
          </p>
          <p className="tabular text-sm">123.456.789-01 · (11) 98765-4321 · 28/07/2026</p>
        </div>
      </section>

      <section className="mt-12" aria-labelledby="controls-heading">
        <h2 id="controls-heading" className="text-lg font-semibold">
          Controls
        </h2>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="default">Save person</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Delete</Button>
          <Button variant="link">Link</Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <PersonTypeBadge type="CLIENT" />
          <PersonTypeBadge type="SUPPLIER" />
          <PersonTypeBadge type="USER" />
          <PersonTypeBadge type="EMPLOYEE" />
          <PersonStatusBadge active />
          <PersonStatusBadge active={false} />
        </div>

        <Card className="mt-6 max-w-md" data-testid="styleguide-card">
          <CardHeader>
            <CardTitle>Form fields</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 pb-6">
            <div className="grid gap-2">
              <Label htmlFor="styleguide-email">Email</Label>
              <Input
                id="styleguide-email"
                type="email"
                spellCheck={false}
                placeholder="you@example.com"
                data-testid="styleguide-input-email"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="styleguide-notes">Notes</Label>
              <Textarea id="styleguide-notes" rows={3} placeholder="Anything worth recording…" />
            </div>

            <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
              <Checkbox data-testid="styleguide-checkbox-remember" />
              Remember me
            </label>

            <Button data-testid="styleguide-button-submit">Sign in</Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
