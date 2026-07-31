import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Button } from '@/components/ui/button';
import { ButtonsActionsSection } from './_components/buttons-actions-section';
import { DataDisplaySection } from './_components/data-display-section';
import { FeedbackStatusSection } from './_components/feedback-status-section';
import { FormControlsSection } from './_components/form-controls-section';
import { FoundationsSection } from './_components/foundations-section';
import { LayoutStructureSection } from './_components/layout-structure-section';
import { NavigationDisclosureSection } from './_components/navigation-disclosure-section';
import { OverlaysSection } from './_components/overlays-section';
import { StyleguideNav } from './_components/styleguide-nav';

export const metadata: Metadata = {
  title: 'Design system',
};

/**
 * A live reference for every token and component the app is built from —
 * moved off `/` so the root can be the product's front door. Every
 * component here is a real import from `components/ui/`, never a
 * screenshot or a re-implementation, so this page can't drift out of sync
 * with what the app actually ships.
 */
export default function StyleguidePage() {
  return (
    <div className="min-h-dvh bg-background" data-testid="styleguide-page">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-start justify-between gap-4 px-6 py-8">
          <div>
            <p className="eyebrow text-primary">Olival</p>
            <h1 className="mt-1.5 font-display text-3xl font-semibold text-foreground">
              Design system
            </h1>
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">
              Every token and component the app is built from, in one place — palette taken from the
              mark and the site photograph: olive foliage, ink, and the amber of a safety vest on
              limestone.
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
      </header>

      <div className="mx-auto flex max-w-7xl gap-12 px-6 py-10">
        <aside className="hidden w-52 shrink-0 lg:block">
          <div className="sticky top-10 max-h-[calc(100dvh-5rem)] overflow-y-auto pb-10">
            <StyleguideNav />
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="flex flex-col">
            <FoundationsSection />
            <ButtonsActionsSection />
            <FormControlsSection />
            <FeedbackStatusSection />
            <OverlaysSection />
            <NavigationDisclosureSection />
            <LayoutStructureSection />
            <DataDisplaySection />
          </div>
        </main>
      </div>
    </div>
  );
}
