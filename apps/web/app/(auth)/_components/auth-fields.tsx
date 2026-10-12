'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useT } from '@/lib/i18n/provider';
import { cn } from '@/lib/utils';

/** Auth inputs are the 44px touch size (handoff § 4), whatever the screen. */
const AUTH_INPUT_CLASS = 'h-11';

/**
 * The email field of both auth forms: a leading mail icon, nothing else. It is
 * rendered inside `FormControl`, which hands its `id` and `aria-*` to whatever
 * it wraps — so every prop goes straight on to the `<input>`.
 */
export function EmailInput({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <div className="relative flex items-center">
      <Mail className="pointer-events-none absolute left-3 size-4 text-text-3" aria-hidden="true" />
      <Input
        type="email"
        autoComplete="email"
        inputMode="email"
        autoCapitalize="none"
        spellCheck={false}
        className={cn(AUTH_INPUT_CLASS, 'pl-9', className)}
        {...props}
      />
    </div>
  );
}

interface PasswordInputProps extends React.ComponentProps<'input'> {
  /** Kept per form (`auth-login-button-toggle-password`) so tests can tell them apart. */
  toggleTestId?: string;
}

/** A lock icon, and an eye button that reveals the password (`aria-pressed`, handoff § 4). */
export function PasswordInput({ className, toggleTestId, ...props }: PasswordInputProps) {
  const t = useT();
  const [isVisible, setVisible] = useState(false);

  return (
    <div className="relative flex items-center">
      <Lock className="pointer-events-none absolute left-3 size-4 text-text-3" aria-hidden="true" />
      <Input
        type={isVisible ? 'text' : 'password'}
        spellCheck={false}
        className={cn(AUTH_INPUT_CLASS, 'pr-11 pl-9', className)}
        {...props}
      />
      <button
        type="button"
        aria-label={t(isVisible ? 'auth.fields.hidePassword' : 'auth.fields.showPassword')}
        aria-pressed={isVisible}
        data-testid={toggleTestId}
        onClick={() => setVisible((value) => !value)}
        className="absolute right-1 grid size-9 place-items-center rounded-sm text-text-3 transition-colors hover:text-foreground focus-visible:ring-focus"
      >
        {isVisible ? (
          <EyeOff className="size-4" aria-hidden="true" />
        ) : (
          <Eye className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
