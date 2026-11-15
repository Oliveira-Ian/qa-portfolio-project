import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface GuardPanelProps {
  overline: string;
  title: string;
  body: string;
  /** An info line under the body — what this is *not* (a product-access problem, say). */
  note?: string;
  backHref: string;
  backLabel: string;
  /** `data-testid` of the panel; its title and button derive from it (`-title`, `-back`). */
  testId: string;
}

/**
 * The card both "you can't see this" states share (design S07–S09): an icon and
 * overline, a headline that says what is missing, the reason, and one way back.
 * What differs — product access, an ERP permission, company administration — is
 * only the words, so it is the caller's.
 */
export function GuardPanel({
  overline,
  title,
  body,
  note,
  backHref,
  backLabel,
  testId,
}: GuardPanelProps) {
  return (
    <div className="grid place-items-center py-10 md:py-16" data-testid={testId}>
      <div className="w-full max-w-[560px] rounded-xl border border-border bg-card p-6 shadow-card md:p-10">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-lg bg-accent-50 text-accent-600">
            <ShieldAlert className="size-5" aria-hidden="true" />
          </span>
          <span className="olv-overline text-text-3">{overline}</span>
        </div>

        <h1 className="mt-6 text-[28px] leading-[34px]" data-testid={`${testId}-title`}>
          {title}
        </h1>

        <p className="mt-4 text-[15px] leading-[1.6] text-text-2">{body}</p>

        {note ? (
          <Alert variant="info" className="mt-6">
            <AlertDescription>{note}</AlertDescription>
          </Alert>
        ) : null}

        <div className="mt-8">
          <Button asChild variant="outline" data-testid={`${testId}-back`}>
            <Link href={backHref}>
              <ArrowLeft aria-hidden="true" />
              {backLabel}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
