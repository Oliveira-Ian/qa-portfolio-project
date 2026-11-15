'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { authMessages, registerFormSchema, type RegisterFormValues } from '@oliveira/schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { translateApiMessage } from '@/lib/i18n/api-messages';
import { useT } from '@/lib/i18n/provider';
import { ROUTES } from '@/lib/navigation/routes';
import { PLATFORM_NAME } from '@/lib/products';
import { EmailInput, PasswordInput } from '../../_components/auth-fields';
import { registerAction } from '../_actions/register';

/** Long enough to read the confirmation, short enough not to feel stuck. */
const REDIRECT_DELAY_MS = 1_500;

export function RegisterForm() {
  const t = useT();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isRegistered, setRegistered] = useState(false);
  const [isEmailTaken, setEmailTaken] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { fullName: '', email: '', password: '', birthDate: '' },
  });

  // The pause exists so the confirmation toast is actually read before the page
  // changes under it. Owning the timer in an effect means React clears it if the
  // user navigates away first, instead of pushing a route on an unmounted form.
  useEffect(() => {
    if (!isRegistered) {
      return;
    }

    const timer = setTimeout(() => router.push(ROUTES.login), REDIRECT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isRegistered, router]);

  function handleValid(values: RegisterFormValues) {
    if (isPending || isRegistered) {
      return;
    }

    setEmailTaken(false);

    startTransition(async () => {
      const result = await registerAction(values);
      const message = translateApiMessage(result.message ?? '', t);

      if (!result.success) {
        // "Email already exists" also gets an in-page alert with the way out
        // (handoff S02); everything else is a toast only.
        setEmailTaken(result.message === authMessages.register.emailTaken);
        toast.error(message);
        return;
      }

      toast.success(message);
      setRegistered(true);
    });
  }

  function handleInvalid() {
    const values = form.getValues();

    if (!values.fullName || !values.email || !values.password || !values.birthDate) {
      toast.error(translateApiMessage(authMessages.register.missingFields, t));
    }
  }

  return (
    <div className="w-full max-w-[26rem]" data-testid="auth-register-card">
      <p className="olv-overline text-text-3" translate="no">
        {PLATFORM_NAME}
      </p>
      <h1 className="olv-title-l mt-2 text-foreground" data-testid="auth-register-title">
        {t('auth.register.title')}
      </h1>
      <p className="mt-2 text-[15px] leading-[22px] text-text-2">{t('auth.register.lead')}</p>

      <Form {...form}>
        <form
          className="mt-7 flex flex-col gap-5"
          data-testid="auth-register-form"
          onSubmit={form.handleSubmit(handleValid, handleInvalid)}
          noValidate
        >
          {isEmailTaken ? (
            <Alert variant="destructive" data-testid="auth-register-alert-email-taken">
              <AlertTitle>{t('auth.register.takenTitle')}</AlertTitle>
              <AlertDescription>
                {t('auth.register.takenBody')}{' '}
                <Link href={ROUTES.login}>{t('auth.register.signIn')}</Link>
              </AlertDescription>
            </Alert>
          ) : null}

          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-testid="auth-register-label-fullname">
                  {t('auth.fields.fullName')}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    autoComplete="name"
                    placeholder={t('auth.fields.fullNamePlaceholder')}
                    className="h-11"
                    data-testid="auth-register-input-fullname"
                  />
                </FormControl>
                <FormMessage data-testid="auth-register-error-fullname" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-testid="auth-register-label-email">
                  {t('auth.fields.workEmail')}
                </FormLabel>
                <FormControl>
                  <EmailInput
                    {...field}
                    placeholder={t('auth.fields.emailPlaceholder')}
                    data-testid="auth-register-input-email"
                  />
                </FormControl>
                <FormMessage data-testid="auth-register-error-email" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-testid="auth-register-label-password">
                  {t('auth.fields.password')}
                </FormLabel>
                <FormControl>
                  <PasswordInput
                    {...field}
                    autoComplete="new-password"
                    toggleTestId="auth-register-button-toggle-password"
                    data-testid="auth-register-input-password"
                  />
                </FormControl>
                <FormMessage data-testid="auth-register-error-password" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-testid="auth-register-label-birthdate">
                  {t('auth.fields.birthDate')}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="date"
                    autoComplete="bday"
                    className="h-11 tabular"
                    data-testid="auth-register-input-birthdate"
                  />
                </FormControl>
                <FormMessage data-testid="auth-register-error-birthdate" />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            size="lg"
            className="w-full"
            data-testid="auth-register-button-submit"
            loading={isPending}
          >
            {t('auth.register.submit')}
          </Button>

          <p className="border-t border-border pt-5 text-sm text-text-2">
            {t('auth.register.haveAccount')}{' '}
            <Link
              href={ROUTES.login}
              className="rounded-xs font-semibold text-foreground underline decoration-transparent underline-offset-3 hover:decoration-current focus-visible:ring-focus"
              data-testid="auth-register-link-login"
            >
              {t('auth.register.signIn')}
            </Link>
          </p>
        </form>
      </Form>
    </div>
  );
}
