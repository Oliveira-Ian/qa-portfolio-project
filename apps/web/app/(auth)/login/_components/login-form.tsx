'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { authMessages, loginFormSchema, type LoginFormValues } from '@oliveira/schemas';
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
import { Input } from '@/components/ui/input';
import { loginAction } from '../_actions/login';

const REMEMBERED_EMAIL_KEY = 'rememberedEmail';

interface LoginFormProps {
  /** Where to land after signing in, supplied by `middleware.ts`. */
  next?: string | undefined;
}

export function LoginForm({ next }: LoginFormProps) {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

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
      setRemember(true);
    }
  }, [form]);

  function handleValid(values: LoginFormValues) {
    if (remember) {
      window.localStorage.setItem(REMEMBERED_EMAIL_KEY, values.email);
    } else {
      window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    }

    startTransition(async () => {
      // On success the action redirects, so nothing comes back to handle here.
      const result = await loginAction(values, next);

      if (result?.success === false) {
        toast.error(result.message);
      }
    });
  }

  function handleInvalid() {
    // The inline messages already name each field; the toast is the global
    // "you submitted an empty form" signal documented in auth_rules.md.
    const { email, password } = form.getValues();

    if (!email || !password) {
      toast.error(authMessages.login.missingFields);
    }
  }

  return (
    <div className="w-full max-w-[26rem]" data-testid="auth-login-card">
      <p className="eyebrow text-primary">Oliveira ERP</p>
      <h1
        className="mt-2 text-[2rem] leading-[1.1] font-semibold text-foreground"
        data-testid="auth-login-title"
      >
        Sign in
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Pick up where the site left off — records, contacts and suppliers.
      </p>
      <div className="measured-rule mt-6" aria-hidden="true" />

      <Form {...form}>
        <form
          className="mt-6 flex flex-col gap-5"
          data-testid="auth-login-form"
          onSubmit={form.handleSubmit(handleValid, handleInvalid)}
          noValidate
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-testid="auth-login-label-email">Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="you@example.com"
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
                <FormLabel data-testid="auth-login-label-password">Password</FormLabel>
                <div className="relative flex items-center">
                  <FormControl>
                    <Input
                      {...field}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      spellCheck={false}
                      className="pr-11"
                      data-testid="auth-login-input-password"
                    />
                  </FormControl>
                  <button
                    type="button"
                    className="absolute right-1 grid size-9 place-items-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    data-testid="auth-login-button-toggle-password"
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                <FormMessage data-testid="auth-login-error-password" />
              </FormItem>
            )}
          />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={remember}
                onCheckedChange={(checked) => setRemember(checked === true)}
                data-testid="auth-login-checkbox-remember"
              />
              Remember me
            </label>
            <button
              type="button"
              className="rounded-sm text-sm text-primary underline underline-offset-4 hover:text-primary-hover focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
              data-testid="auth-login-link-forgot"
              onClick={() => toast.warning('Not implemented')}
            >
              Forgot password
            </button>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            data-testid="auth-login-button-submit"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </Button>

          <p className="text-sm text-muted-foreground">
            Don&rsquo;t have an account?{' '}
            <Link
              href="/register"
              className="rounded-sm text-primary underline underline-offset-4 hover:text-primary-hover focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
              data-testid="auth-login-link-register"
            >
              Create one
            </Link>
          </p>
        </form>
      </Form>
    </div>
  );
}
