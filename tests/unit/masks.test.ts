import { describe, expect, it } from 'vitest';
import { maskDocument, maskPhone } from '../../apps/web/lib/masks.js';

describe('maskDocument', () => {
  it('formats a complete CPF', () => {
    expect(maskDocument('12345678901', 'CPF')).toBe('123.456.789-01');
  });

  it('formats a complete CNPJ', () => {
    expect(maskDocument('12345678000199', 'CNPJ')).toBe('12.345.678/0001-99');
  });

  it('strips non-digit characters before matching', () => {
    expect(maskDocument('123.456.789-01', 'CPF')).toBe('123.456.789-01');
  });

  it('leaves an incomplete number unmasked (regex has no partial match)', () => {
    expect(maskDocument('123', 'CPF')).toBe('123');
  });
});

describe('maskPhone', () => {
  it('formats a complete phone number', () => {
    expect(maskPhone('11987654321')).toBe('(11) 98765-4321');
  });

  it('strips non-digit characters before matching', () => {
    expect(maskPhone('(11) 98765-4321')).toBe('(11) 98765-4321');
  });

  it('leaves an incomplete number unmasked', () => {
    expect(maskPhone('119')).toBe('119');
  });
});
