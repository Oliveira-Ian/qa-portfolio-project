'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type SubmitEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { postJson, type ApiResponse } from '@/lib/api';

// Field checks and messages mirror docs/product/auth_rules.md exactly —
// see apps/api/src/controllers/authController.ts for the same pattern.
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // One-time hydration from localStorage (unavailable during SSR) — can't
    // be a lazy useState initializer without a hydration mismatch.
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEmail(savedEmail);
      setRemember(true);
    }
  }, []);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailError('');
    setPasswordError('');

    let hasError = false;

    if (!email) {
      setEmailError('Valid email is required');
      hasError = true;
    } else if (!isValidEmail(email)) {
      setEmailError('Valid email is required');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Password is required');
      hasError = true;
    }

    if (hasError) {
      if (!email || !password) {
        toast.error('Please fill in email and password');
      }
      return;
    }

    setSubmitting(true);
    try {
      const response = await postJson('/login', { email, password });
      const result = (await response.json()) as ApiResponse<{ message: string }>;

      if (response.ok) {
        if (remember) {
          localStorage.setItem('rememberedEmail', email);
          localStorage.setItem('rememberedUser', email);
        } else {
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberedUser');
        }
        router.push('/home');
        return;
      }

      toast.error(result.error || 'Invalid email or password');
    } catch (error) {
      toast.error('Invalid email or password');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card
      className="w-full max-w-[420px] gap-0 rounded-lg p-[var(--spacing-2xl)] shadow-card"
      data-testid="auth-login-card"
    >
      <Image
        src="/images/logo-ian2.png"
        alt="Oliveira ERP logo"
        width={57}
        height={56}
        className="mx-auto mb-[var(--spacing-xl)] w-auto object-contain mix-blend-multiply"
      />
      <h2
        className="mb-[var(--spacing-xl)] text-center text-[1.875rem] font-bold tracking-[-0.025em] text-foreground"
        data-testid="auth-login-title"
      >
        Sign In
      </h2>

      <form
        className="flex flex-col gap-[var(--spacing-lg)]"
        data-testid="auth-login-form"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" data-testid="auth-login-label-email">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="rounded-md shadow-input"
            data-testid="auth-login-input-email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <p
            className="text-sm text-destructive"
            data-testid="auth-login-error-email"
            aria-live="polite"
          >
            {emailError}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password" data-testid="auth-login-label-password">
            Password
          </Label>
          <div className="relative flex items-center">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className="rounded-md pr-11 shadow-input"
              data-testid="auth-login-input-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              className="absolute right-3 text-sm text-muted-foreground hover:text-foreground"
              data-testid="auth-login-button-toggle-password"
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <p
            className="text-sm text-destructive"
            data-testid="auth-login-error-password"
            aria-live="polite"
          >
            {passwordError}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="flex cursor-pointer items-center gap-2">
            <Checkbox
              checked={remember}
              onCheckedChange={(checked) => setRemember(checked === true)}
              data-testid="auth-login-checkbox-remember"
            />
            <span className="text-sm text-muted-foreground">Remember me</span>
          </label>
          <button
            type="button"
            className="text-sm text-primary underline hover:text-primary-hover"
            data-testid="auth-login-link-forgot"
            onClick={() => toast.warning('Not implemented')}
          >
            Forgot password
          </button>
        </div>

        <span className="text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="text-primary underline hover:text-primary-hover"
            data-testid="auth-login-link-register"
          >
            Sign up
          </Link>
        </span>

        <Button
          type="submit"
          className="rounded-md bg-primary text-primary-foreground shadow-button hover:bg-primary-hover"
          data-testid="auth-login-button-submit"
          disabled={submitting}
        >
          Sign In
        </Button>
      </form>
    </Card>
  );
}
