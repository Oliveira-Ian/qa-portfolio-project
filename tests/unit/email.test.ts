import { describe, expect, it } from 'vitest';
import { isValidEmail } from '../../apps/api/src/utils/email.js';

describe('isValidEmail', () => {
  it('accepts a well-formed email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('rejects a string without an @', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
  });

  it('rejects a string without a domain', () => {
    expect(isValidEmail('user@')).toBe(false);
  });
});
