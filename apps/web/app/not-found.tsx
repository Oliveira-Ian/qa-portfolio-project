import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getTranslator } from '@/lib/i18n/server';
import { ROUTES } from '@/lib/navigation/routes';

export default async function NotFound() {
  const t = await getTranslator();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-16 text-center">
      <p className="olv-overline text-accent-600">404</p>
      <h1 className="mt-3" data-testid="not-found-title">
        {t('errors.notFound.title')}
      </h1>
      <p className="mt-3 max-w-md text-sm text-text-3">{t('errors.notFound.body')}</p>

      <Button asChild className="mt-6" data-testid="not-found-button-home">
        <Link href={ROUTES.home}>{t('guard.backToHome')}</Link>
      </Button>
    </div>
  );
}
