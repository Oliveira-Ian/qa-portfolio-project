import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Route } from 'lucide-react';
import { PRODUCT_LABELS } from '@oliveira/schemas';
import { Button } from '@/components/ui/button';
import { getTranslator } from '@/lib/i18n/server';
import { ROUTES } from '@/lib/navigation/routes';

export const metadata: Metadata = {
  title: 'Oliveira FSM',
};

/**
 * Oliveira FSM is announced, not built (design S17): a "coming soon"
 * placeholder with no modules, no sidebar and nothing invented to fill the
 * space. Its first screens are the FSM Epic's (#57), specified separately.
 */
export default async function FsmPage() {
  const t = await getTranslator();

  return (
    <div className="grid place-items-center py-10 md:py-20" data-testid="fsm-placeholder">
      <div className="w-full max-w-[560px] rounded-xl border border-border bg-card p-6 shadow-card md:p-10">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-lg bg-accent-50 text-accent-600">
            <Route className="size-5" aria-hidden="true" />
          </span>
          <span className="olv-overline text-text-3">{t('fsm.overline')}</span>
        </div>

        <h1 className="mt-6 text-[28px] leading-[34px]">{PRODUCT_LABELS.FSM}</h1>
        <p className="mt-2 olv-overline text-accent-600">{t('fsm.soon')}</p>
        <p className="mt-4 text-[15px] leading-[1.6] text-text-2">{t('fsm.body')}</p>

        <div className="mt-8">
          <Button asChild variant="outline" data-testid="fsm-back-home" data-product="platform">
            <Link href={ROUTES.home}>
              <ArrowLeft aria-hidden="true" />
              {t('guard.backToHome')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
