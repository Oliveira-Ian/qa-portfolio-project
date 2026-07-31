import { z } from 'zod';
import { isValidEmail } from './email.js';
import type { PermissionKey } from './permissions.js';

/**
 * Every user-facing auth string in one place.
 *
 * These are contract, not copy: `docs/product/auth_rules.md` and
 * `docs/api/http_responses.md` document them verbatim. Note that the *same*
 * condition intentionally reads differently on each side — a badly formatted
 * e-mail is `Valid email is required` inline in the login form but
 * `Invalid email format` from the API. Both are documented; do not unify them.
 */
export const authMessages = {
  login: {
    /** Global toast + API 400 when either field is empty. */
    missingFields: 'Please fill in email and password',
    /** API 400 when the e-mail is present but malformed. */
    invalidEmailFormat: 'Invalid email format',
    /** API 401 — same message for unknown e-mail and wrong password. */
    invalidCredentials: 'Invalid email or password',
    success: 'Login successful',
    /** Inline field errors in the login form. */
    fields: {
      email: 'Valid email is required',
      password: 'Password is required',
    },
  },
  register: {
    missingFields: 'Please fill in all required fields',
    invalidEmail: 'Invalid email',
    /** Documented as 400, not 409 — see docs/api/http_responses.md. */
    emailTaken: 'Email already exists',
    success: 'User created successfully',
    fields: {
      fullName: 'Full name is required',
      email: 'Invalid email',
      password: 'Password is required',
      birthDate: 'Birth date is required',
    },
  },
} as const;

/* -------------------------------------------------------------------------- */
/* Transport shapes                                                            */
/* -------------------------------------------------------------------------- */

export const loginSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export const registerSchema = z.object({
  fullName: z.string(),
  email: z.string(),
  password: z.string(),
  /** ISO date, `YYYY-MM-DD`. */
  birthDate: z.string(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

/* -------------------------------------------------------------------------- */
/* Client-side form schemas (per-field messages, all reported at once)          */
/* -------------------------------------------------------------------------- */

/**
 * One message for both "empty" and "malformed" — matches the legacy forms,
 * where `if (!email) … else if (!isValidEmail(email))` set the same string.
 */
const emailField = (message: string) =>
  z
    .string()
    .trim()
    .refine((value) => isValidEmail(value), { message });

export const loginFormSchema = z.object({
  email: emailField(authMessages.login.fields.email),
  password: z.string().min(1, authMessages.login.fields.password),
});

export const registerFormSchema = z.object({
  fullName: z.string().trim().min(1, authMessages.register.fields.fullName),
  email: emailField(authMessages.register.fields.email),
  password: z.string().min(1, authMessages.register.fields.password),
  birthDate: z.string().min(1, authMessages.register.fields.birthDate),
});

export type LoginFormValues = z.input<typeof loginFormSchema>;
export type RegisterFormValues = z.input<typeof registerFormSchema>;

/* -------------------------------------------------------------------------- */
/* Server-side request validation (single message, documented order)           */
/* -------------------------------------------------------------------------- */

export type RequestValidation<T> = { success: true; data: T } | { success: false; error: string };

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function readString(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === 'string' ? value : '';
}

/**
 * The API reports only the *first* problem, and the order is part of the
 * contract: "fields missing" always wins over "e-mail malformed", so a request
 * with no password and a broken e-mail reports the missing password.
 */
export function validateLoginRequest(body: unknown): RequestValidation<LoginInput> {
  const source = asRecord(body);
  const email = readString(source, 'email');
  const password = readString(source, 'password');

  if (!email || !password) {
    return { success: false, error: authMessages.login.missingFields };
  }

  if (!isValidEmail(email)) {
    return { success: false, error: authMessages.login.invalidEmailFormat };
  }

  return { success: true, data: { email, password } };
}

export function validateRegisterRequest(body: unknown): RequestValidation<RegisterInput> {
  const source = asRecord(body);
  const fullName = readString(source, 'fullName');
  const email = readString(source, 'email');
  const password = readString(source, 'password');
  const birthDate = readString(source, 'birthDate');

  if (!fullName || !email || !password || !birthDate) {
    return { success: false, error: authMessages.register.missingFields };
  }

  if (!isValidEmail(email)) {
    return { success: false, error: authMessages.register.invalidEmail };
  }

  return { success: true, data: { fullName, email, password, birthDate } };
}

/* -------------------------------------------------------------------------- */
/* Session                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Technical role — controls system administration access, not what the
 * account holder does in the business (that's AccessProfile, added in a
 * later phase). SYSTEM is reserved for integrations/jobs and cannot sign in
 * interactively.
 */
export const accountRoleSchema = z.enum(['ADMIN', 'USER', 'SYSTEM']);

export type AccountRole = z.infer<typeof accountRoleSchema>;

/**
 * What the API puts in the JWT and hands back on login.
 *
 * `id` is the AccessAccount's id (the credential), `personId` is the linked
 * Person's id (the identity/cadastral record) — kept distinct because they're
 * different entities with different lifecycles, even though every account
 * has exactly one person.
 */
export const sessionAccountSchema = z.object({
  id: z.number(),
  personId: z.string(),
  name: z.string(),
  email: z.string(),
  role: accountRoleSchema,
});

export type SessionAccount = z.infer<typeof sessionAccountSchema>;

/**
 * `GET /api/auth/me`'s response — shared so `apps/api`'s service and
 * `apps/web`'s data-access layer agree on the shape by construction, not by
 * two hand-written copies staying in sync. `permissions` is exactly what the
 * account's `AccessProfile` links grant, unfiltered — it does **not**
 * reflect the `ADMIN` bypass (see `apps/api/src/modules/auth/authorize.ts`);
 * a caller that needs "can this account actually do X" has to check
 * `account.role === 'ADMIN'` itself, same as the authorization engine does.
 */
export interface MeResponse {
  account: { id: number; personId: string; email: string; role: AccountRole; active: boolean };
  person: { id: string; name: string };
  permissions: PermissionKey[];
}
