'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { authMessages, registerFormSchema, type RegisterFormValues } from '@oliveira/schemas';
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
import { registerAction } from '../_actions/register';

/** Long enough to read the confirmation, short enough not to feel stuck. */
const REDIRECT_DELAY_MS = 1_500;

export function RegisterForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistered, setRegistered] = useState(false);

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

    const timer = setTimeout(() => router.push('/login'), REDIRECT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isRegistered, router]);

  function handleValid(values: RegisterFormValues) {
    startTransition(async () => {
      const result = await registerAction(values);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setRegistered(true);
    });
  }

  function handleInvalid() {
    const values = form.getValues();

    if (!values.fullName || !values.email || !values.password || !values.birthDate) {
      toast.error(authMessages.register.missingFields);
    }
  }

  return (
    <div className="w-full max-w-[26rem]" data-testid="auth-register-card">
      <p className="eyebrow text-primary">Oliveira ERP</p>
      <h1
        className="mt-2 text-[2rem] leading-[1.1] font-semibold text-foreground"
        data-testid="auth-register-title"
      >
        Create your account
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">One account covers the whole registry.</p>
      <div className="measured-rule mt-6" aria-hidden="true" />

      <Form {...form}>
        <form
          className="mt-6 flex flex-col gap-5"
          data-testid="auth-register-form"
          onSubmit={form.handleSubmit(handleValid, handleInvalid)}
          noValidate
        >
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-testid="auth-register-label-fullname">Full name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    autoComplete="name"
                    placeholder="Ana Oliveira"
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
                <FormLabel data-testid="auth-register-label-email">Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="you@example.com"
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
                <FormLabel data-testid="auth-register-label-password">Password</FormLabel>
                <div className="relative flex items-center">
                  <FormControl>
                    <Input
                      {...field}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      spellCheck={false}
                      className="pr-11"
                      data-testid="auth-register-input-password"
                    />
                  </FormControl>
                  <button
                    type="button"
                    className="absolute right-1 grid size-9 place-items-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    data-testid="auth-register-button-toggle-password"
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                <FormMessage data-testid="auth-register-error-password" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-testid="auth-register-label-birthdate">Birth date</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="date"
                    autoComplete="bday"
                    className="tabular"
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
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Creating account…
              </>
            ) : (
              'Create account'
            )}
          </Button>

          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/login"
              className="rounded-sm text-primary underline underline-offset-4 hover:text-primary-hover focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
              data-testid="auth-register-link-login"
            >
              Sign in
            </Link>
          </p>
        </form>
      </Form>
    </div>
  );
}
