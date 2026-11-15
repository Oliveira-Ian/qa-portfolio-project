import { PRODUCT_LABELS, type Product } from '@oliveira/schemas';
import { getTranslator } from '@/lib/i18n/server';
import type { MessageKey } from '@/lib/i18n/translate';
import { ROUTES } from '@/lib/navigation/routes';
import { GuardPanel } from './guard-panel';

interface NoPermissionProps {
  /** The screen's name, as a translation key ("People", "Access profiles"). */
  screen: MessageKey;
  /** The product whose profile lacks the permission — the ERP by default. */
  product?: Product;
  /** Where "back" goes: the product's home by default. */
  backHref?: string;
}

/**
 * Inside a product, for a user who has a seat but not the View permission for this
 * screen (design S09). The product shell stays — the sidebar already hides what
 * they can't view — and the message says why: the product's access profile doesn't
 * grant it. It also says this is not the same as product access, which is the
 * Platform's and already fine. The API refuses the data either way.
 */
export async function NoPermission({ screen, product: area = 'ERP', backHref }: NoPermissionProps) {
  const t = await getTranslator();
  const product = PRODUCT_LABELS[area];

  return (
    <GuardPanel
      testId="no-permission"
      overline={t('guard.noPermission.overline')}
      title={t('guard.noPermission.title', { screen: t(screen) })}
      body={t('guard.noPermission.body', { product })}
      note={t('guard.noPermission.note', { product })}
      backHref={backHref ?? (area === 'ERP' ? ROUTES.erp.home : ROUTES.fsm.home)}
      backLabel={t('guard.noPermission.back', { product })}
    />
  );
}
