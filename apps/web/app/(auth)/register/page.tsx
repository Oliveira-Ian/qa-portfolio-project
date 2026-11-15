import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isPublicRegistrationEnabled } from '@/lib/deployment';
import { getTranslator } from '@/lib/i18n/server';
import { RegisterForm } from './_components/register-form';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: t('auth.register.submit') };
}

/** Public sign-up is off unless the deployment turns it on (`PUBLIC_REGISTRATION_ENABLED`). */
export default function RegisterPage() {
  if (!isPublicRegistrationEnabled()) {
    notFound();
  }

  return <RegisterForm />;
}
