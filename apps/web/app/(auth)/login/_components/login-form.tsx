'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { authMessages, loginFormSchema, type LoginFormValues } from '@oliveira/schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { translateApiMessage } from '@/lib/i18n/api-messages';
import { useT } from '@/lib/i18n/provider';
import { ROUTES } from '@/lib/navigation/routes';
import { PLATFORM_NAME } from '@/lib/products';
import { EmailInput, PasswordInput } from '../../_components/auth-fields';
import { loginAction } from '../_actions/login';

const REMEMBERED_EMAIL_KEY = 'rememberedEmail';

interface LoginFormProps {
  /** Where to land after signing in, supplied by `proxy.ts`. */
  next?: string | undefined;
}

export function LoginForm({ next }: LoginFormProps) {
  const t = useT();
  const [isPending, startTransition] = useTransition();
  const [isRemembered, setRemembered] = useState(false);
  const [hasFailed, setFailed] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    // localStorage doesn't exist during SSR, so this can't be a lazy useState
    // initializer without a hydration mismatch.
    const saved = window.localStorage.getItem(REMEMBERED_EMAIL_KEY);

    if (saved) {
      form.setValue('email', saved);
      // Hydrating from storage is the "sync with an external system" case the
      // rule exempts in prose; there is no render-time value to derive it from.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRemembered(true);
    }
  }, [form]);

  function handleValid(values: LoginFormValues) {
    if (isPending) {
      return;
    }

    if (isRemembered) {
      window.localStorage.setItem(REMEMBERED_EMAIL_KEY, values.email);
    } else {
      window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    }

    setFailed(false);

    startTransition(async () => {
      // On success the action redirects, so nothing comes back to handle here.
      const result = await loginAction(values, next);

      if (result?.success === false) {
        // The alert is the generic "it didn't work" (handoff S01: never say which
        // of the two was wrong); the toast carries the API's own sentence.
        setFailed(true);
        toast.error(translateApiMessage(result.message ?? '', t));
      }
    });
  }

  function handleInvalid() {
    // The inline messages already name each field; the toast is the global
    // "you submitted an empty form" signal documented in auth_rules.md.
    const { email, password } = form.getValues();

    if (!email || !password) {
      toast.error(translateApiMessage(authMessages.login.missingFields, t));
    }
  }

  return (
    <div className="w-full max-w-[25rem]" data-testid="auth-login-card">
      <p className="olv-overline text-text-3" translate="no">
        {PLATFORM_NAME}
      </p>
      <h1 className="olv-title-l mt-2 text-foreground" data-testid="auth-login-title">
        {t('auth.signIn.title')}
      </h1>
      <p className="mt-2 text-[15px] leading-[22px] text-text-2">{t('auth.signIn.lead')}</p>

      <Form {...form}>
        <form
          className="mt-7 flex flex-col gap-5"
          data-testid="auth-login-form"
          onSubmit={form.handleSubmit(handleValid, handleInvalid)}
          noValidate
        >
          {hasFailed ? (
            <Alert variant="destructive" data-testid="auth-login-alert">
              <AlertTitle>{t('auth.signIn.failedTitle')}</AlertTitle>
              <AlertDescription>{t('auth.signIn.failedBody')}</AlertDescription>
            </Alert>
          ) : null}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-testid="auth-login-label-email">{t('auth.fields.email')}</FormLabel>
                <FormControl>
                  <EmailInput
                    {...field}
                    // `username` is what a password manager pairs with `current-password`.
                    autoComplete="username"
                    placeholder={t('auth.fields.emailPlaceholder')}
                    data-testid="auth-login-input-email"
                  />
                </FormControl>
                <FormMessage data-testid="auth-login-error-email" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-baseline justify-between gap-4">
                  <FormLabel data-testid="auth-login-label-password">
                    {t('auth.fields.password')}
                  </FormLabel>
                  <button
                    type="button"
                    className="rounded-xs text-[13px] font-semibold text-foreground underline decoration-transparent underline-offset-3 hover:decoration-current focus-visible:ring-focus"
                    data-testid="auth-login-link-forgot"
                    onClick={() => toast.warning(t('auth.signIn.forgotUnavailable'))}
                  >
                    {t('auth.signIn.forgot')}
                  </button>
                </div>
                <FormControl>
                  <PasswordInput
                    {...field}
                    autoComplete="current-password"
                    toggleTestId="auth-login-button-toggle-password"
                    data-testid="auth-login-input-password"
                  />
                </FormControl>
                <FormMessage data-testid="auth-login-error-password" />
              </FormItem>
            )}
          />

          <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm text-text-2">
            <Checkbox
              checked={isRemembered}
              onCheckedChange={(checked) => setRemembered(checked === true)}
              data-testid="auth-login-checkbox-remember"
            />
            {t('auth.signIn.remember')}
          </label>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            data-testid="auth-login-button-submit"
            loading={isPending}
          >
            {t('auth.signIn.submit')}
          </Button>

          <p className="border-t border-border pt-5 text-sm text-text-2">
            {t('auth.signIn.newHere')}{' '}
            <Link
              href={ROUTES.register}
              className="rounded-xs font-semibold text-foreground underline decoration-transparent underline-offset-3 hover:decoration-current focus-visible:ring-focus"
              data-testid="auth-login-link-register"
            >
              {t('auth.signIn.createAccount')}
            </Link>
          </p>
        </form>
      </Form>
    </div>
  );
}
