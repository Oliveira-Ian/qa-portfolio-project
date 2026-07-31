import Image from 'next/image';
import { Wordmark } from '@/components/brand/wordmark';

/**
 * Split screen: the site on the left, the form on the right.
 *
 * The photograph is the product's own subject — a build at golden hour — pushed
 * through an ink-to-olive duotone so the brand reads even at a glance. Below
 * 900px the image is dropped rather than shrunk: a letterboxed sliver of a
 * photo adds nothing on a phone, and the form gets the whole viewport.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh" data-testid="auth-layout">
      <div className="relative flex-[0_0_58%] max-[900px]:hidden" data-testid="auth-banner">
        <Image
          src="/images/banner.jpg"
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="58vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0 bg-linear-to-br from-auth-banner-overlay-dark to-auth-banner-overlay-primary"
          aria-hidden="true"
        />

        <div className="absolute inset-0 z-10 flex flex-col justify-between p-10 xl:p-14">
          <Wordmark tone="light" className="text-auth-banner-text" />

          <div className="max-w-[34rem]">
            <p className="eyebrow text-auth-banner-text-muted">Since the first foundation</p>
            <p className="mt-4 font-display text-[clamp(1.75rem,3vw,2.75rem)] leading-[1.12] font-semibold tracking-tight text-auth-banner-text">
              Every client, supplier and cost the site depends on — in one register.
            </p>
            <div className="mt-7 h-px w-16 bg-auth-banner-text/50" aria-hidden="true" />
            <p className="mt-5 text-sm leading-relaxed text-auth-banner-text-muted">
              Built as a QA portfolio: a real database, a real API and a real interface to test
              against.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-[0_0_42%] items-center justify-center bg-background px-6 py-10 max-[900px]:flex-[0_0_100%] sm:px-10">
        {children}
      </div>
    </div>
  );
}
