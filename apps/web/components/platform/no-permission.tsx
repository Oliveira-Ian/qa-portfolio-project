import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { getTranslator } from '@/lib/i18n/server';
import type { MessageKey } from '@/lib/i18n/translate';
import { ROUTES } from '@/lib/navigation/routes';
import { PRODUCT_LABELS } from '@oliveira/schemas';

interface NoPermissionProps {
  /** The screen's name, as a translation key ("People", "Access profiles"). */
  screen: MessageKey;
  /** Where "back" goes: the product's home by default. */
  backHref?: string;
}

/**
 * Inside the ERP, for a user who has a seat but not the View permission for this
 * screen (design S09). The product shell stays — the sidebar already hides what
 * they can't view — and the message says why: the ERP access profile doesn't
 * grant it. It also says this is not the same as product access, which is the
 * Platform's and already fine. The API refuses the data either way.
 */
export async function NoPermission({ screen, backHref = ROUTES.erp.home }: NoPermissionProps) {
  const t = await getTranslator();
  const product = PRODUCT_LABELS.ERP;

  return (
    <div className="grid place-items-center py-10 md:py-16" data-testid="no-permission">
      <div className="w-full max-w-[560px] rounded-xl border border-border bg-card p-6 shadow-card md:p-10">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-lg bg-accent-50 text-accent-600">
            <ShieldAlert className="size-5" aria-hidden="true" />
          </span>
          <span className="olv-overline text-text-3">{t('guard.noPermission.overline')}</span>
        </div>

        <h1 className="mt-6 text-[28px] leading-[34px]" data-testid="no-permission-title">
          {t('guard.noPermission.title', { screen: t(screen) })}
        </h1>

        <p className="mt-4 text-[15px] leading-[1.6] text-text-2">
          {t('guard.noPermission.body', { product })}
        </p>

        <Alert variant="info" className="mt-6">
          <AlertDescription>{t('guard.noPermission.note', { product })}</AlertDescription>
        </Alert>

        <div className="mt-8">
          <Button asChild variant="outline" data-testid="no-permission-back">
            <Link href={backHref}>
              <ArrowLeft aria-hidden="true" />
              {t('guard.noPermission.back', { product })}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
