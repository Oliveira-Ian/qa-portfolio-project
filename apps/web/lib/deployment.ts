import 'server-only';

/**
 * What this deployment of the web app offers, from its environment
 * (docs/operations/environments.md). Read on the server only: the demo
 * password is shown on the login page on purpose — it is the public demo's —
 * but nothing else of the environment reaches the browser.
 */

/** Public sign-up. Off by default: companies add their own members (plan § 2.7). */
export function isPublicRegistrationEnabled(): boolean {
  return process.env.PUBLIC_REGISTRATION_ENABLED === 'true';
}

export interface DemoLogin {
  email: string;
  password: string;
}

/**
 * The public demo's credentials, shown on the login page — only where
 * `DEMO_MODE=true` and both are set (the demo host). Never in development or
 * in the test environment.
 */
export function getDemoLogin(): DemoLogin | null {
  const email = process.env.DEMO_LOGIN_EMAIL;
  const password = process.env.DEMO_LOGIN_PASSWORD;

  return process.env.DEMO_MODE === 'true' && email && password ? { email, password } : null;
}
