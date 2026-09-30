import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('oliveira-api');

const loginAttempts = meter.createCounter('auth.login.attempts', {
  description: 'Login attempts, by outcome',
  unit: '{attempt}',
});

/**
 * One attempt, counted by `outcome` only. There is a single `failure` for every
 * reason (unknown e-mail, wrong password, deactivated, system account) on
 * purpose: the response already hides which one it was, and a metric that told
 * them apart would give that away again. No e-mail, account id or IP is ever a
 * label — every distinct value would be a new time series.
 */
export function recordLoginAttempt(outcome: 'success' | 'failure'): void {
  loginAttempts.add(1, { outcome });
}
