import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Wordmark } from '@/components/brand/wordmark';

/**
 * The public front door.
 *
 * Everything past this page needs a session, so the one job here is to say what
 * the product is and hand over to sign-in. The photograph is the whole hero —
 * the subject is a construction site, and no abstract illustration would say it
 * better.
 */
export default function LandingPage() {
  return (
    <main className="relative flex min-h-dvh flex-col" data-testid="landing-page">
      <Image
        src="/images/banner.jpg"
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div
        className="absolute inset-0 bg-linear-to-b from-auth-banner-overlay-dark via-auth-banner-overlay-dark to-auth-banner-overlay-primary"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-1 flex-col px-6 py-8 sm:px-10">
        <header className="flex items-center justify-between gap-4">
          <Wordmark tone="light" className="text-auth-banner-text" />
          <Button
            asChild
            variant="outline"
            className="border-white/30 bg-white/10 text-white hover:bg-white/20"
          >
            <Link href="/login" data-testid="landing-button-signin">
              Sign in
            </Link>
          </Button>
        </header>

        <div className="flex flex-1 items-center">
          <div className="max-w-3xl py-16">
            <p className="eyebrow text-auth-banner-text-muted">Construction back office</p>
            <h1 className="mt-5 font-display text-[clamp(2.25rem,6vw,4.25rem)] leading-[1.05] font-semibold tracking-tight text-auth-banner-text">
              The register every site runs on.
            </h1>
            <div className="mt-8 h-px w-20 bg-auth-banner-text/50" aria-hidden="true" />
            <p className="mt-6 max-w-xl text-base leading-relaxed text-auth-banner-text-muted sm:text-lg">
              Clients, suppliers and the documents that tie them to a project — kept in one place,
              on a real database, behind a real API.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" data-testid="landing-button-start">
                <Link href="/login">
                  Open the registry
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
              >
                <Link href="/register" data-testid="landing-button-register">
                  Create an account
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <footer className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-auth-banner-text-muted">
          <span>Built as a QA automation portfolio.</span>
          <Link
            href="/styleguide"
            className="rounded-sm underline underline-offset-4 hover:text-auth-banner-text focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            data-testid="landing-link-styleguide"
          >
            Design system
          </Link>
        </footer>
      </div>
    </main>
  );
}
