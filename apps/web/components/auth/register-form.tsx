'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type SubmitEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { postJson, type ApiResponse } from '@/lib/api';

// Field checks and messages mirror docs/product/auth_rules.md exactly —
// see apps/api/src/controllers/authController.ts for the same pattern.
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [birthDateError, setBirthDateError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setFullNameError('');
    setEmailError('');
    setPasswordError('');
    setBirthDateError('');

    let hasError = false;

    if (!fullName) {
      setFullNameError('Full name is required');
      hasError = true;
    }

    if (!email) {
      setEmailError('Invalid email');
      hasError = true;
    } else if (!isValidEmail(email)) {
      setEmailError('Invalid email');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Password is required');
      hasError = true;
    }

    if (!birthDate) {
      setBirthDateError('Birth date is required');
      hasError = true;
    }

    if (hasError) {
      if (!fullName || !email || !password || !birthDate) {
        toast.error('Please fill in all required fields');
      }
      return;
    }

    setSubmitting(true);
    try {
      const response = await postJson('/register', { fullName, email, password, birthDate });
      const result = (await response.json()) as ApiResponse<{ message: string }>;

      if (response.ok) {
        toast.success('Registration successful');
        setTimeout(() => router.push('/login'), 5000);
        return;
      }

      toast.error(result.error || 'Failed to register');
    } catch (error) {
      toast.error('Failed to register');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card
      className="w-full max-w-[420px] gap-0 rounded-lg p-[var(--spacing-2xl)] shadow-card"
      data-testid="auth-register-card"
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
        data-testid="auth-register-title"
      >
        Sign Up
      </h2>

      <form
        className="flex flex-col gap-[var(--spacing-lg)]"
        data-testid="auth-register-form"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="fullname" data-testid="auth-register-label-fullname">
            Full Name
          </Label>
          <Input
            id="fullname"
            name="fullname"
            type="text"
            autoComplete="name"
            className="rounded-md shadow-input"
            data-testid="auth-register-input-fullname"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
          <p
            className="text-sm text-destructive"
            data-testid="auth-register-error-fullname"
            aria-live="polite"
          >
            {fullNameError}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email" data-testid="auth-register-label-email">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="rounded-md shadow-input"
            data-testid="auth-register-input-email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <p
            className="text-sm text-destructive"
            data-testid="auth-register-error-email"
            aria-live="polite"
          >
            {emailError}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password" data-testid="auth-register-label-password">
            Password
          </Label>
          <div className="relative flex items-center">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className="rounded-md pr-11 shadow-input"
              data-testid="auth-register-input-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              className="absolute right-3 text-sm text-muted-foreground hover:text-foreground"
              data-testid="auth-register-button-toggle-password"
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <p
            className="text-sm text-destructive"
            data-testid="auth-register-error-password"
            aria-live="polite"
          >
            {passwordError}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="birthdate" data-testid="auth-register-label-birthdate">
            Birth Date
          </Label>
          <Input
            id="birthdate"
            name="birthdate"
            type="date"
            className="rounded-md shadow-input"
            data-testid="auth-register-input-birthdate"
            value={birthDate}
            onChange={(event) => setBirthDate(event.target.value)}
          />
          <p
            className="text-sm text-destructive"
            data-testid="auth-register-error-birthdate"
            aria-live="polite"
          >
            {birthDateError}
          </p>
        </div>

        <span className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-primary underline hover:text-primary-hover"
            data-testid="auth-register-link-login"
          >
            Sign in
          </Link>
        </span>

        <Button
          type="submit"
          className="rounded-md bg-primary text-primary-foreground shadow-button hover:bg-primary-hover"
          data-testid="auth-register-button-submit"
          disabled={submitting}
        >
          Sign Up
        </Button>
      </form>
    </Card>
  );
}
