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

  it('formats an incomplete CPF progressively', () => {
    expect(maskDocument('123', 'CPF')).toBe('123');
    expect(maskDocument('1234', 'CPF')).toBe('123.4');
    expect(maskDocument('123456789', 'CPF')).toBe('123.456.789');
  });

  it('formats an incomplete CNPJ progressively', () => {
    expect(maskDocument('1', 'CNPJ')).toBe('1');
    expect(maskDocument('123', 'CNPJ')).toBe('12.3');
    expect(maskDocument('12345678', 'CNPJ')).toBe('12.345.678');
    expect(maskDocument('123456780001', 'CNPJ')).toBe('12.345.678/0001');
  });

  it('truncates a CPF at 11 digits instead of leaving overflow unformatted', () => {
    expect(maskDocument('123456789019999', 'CPF')).toBe('123.456.789-01');
  });

  it('truncates a CNPJ at 14 digits instead of leaving overflow unformatted', () => {
    expect(maskDocument('123456780001995678', 'CNPJ')).toBe('12.345.678/0001-99');
  });
});

describe('maskPhone', () => {
  it('formats a complete mobile number (11 digits)', () => {
    expect(maskPhone('11987654321')).toBe('(11) 98765-4321');
  });

  it('formats a complete landline number (10 digits)', () => {
    expect(maskPhone('1134567890')).toBe('(11) 3456-7890');
  });

  it('strips non-digit characters before matching', () => {
    expect(maskPhone('(11) 98765-4321')).toBe('(11) 98765-4321');
  });

  it('formats an incomplete number progressively', () => {
    expect(maskPhone('1')).toBe('(1');
    expect(maskPhone('11')).toBe('(11');
    expect(maskPhone('119')).toBe('(11) 9');
    expect(maskPhone('1134567')).toBe('(11) 3456-7');
  });

  it('reflows from the landline shape to the mobile shape once an 11th digit is typed', () => {
    expect(maskPhone('113456789')).toBe('(11) 3456-789');
    expect(maskPhone('1134567890')).toBe('(11) 3456-7890');
    expect(maskPhone('11345678901')).toBe('(11) 34567-8901');
  });

  it('truncates at 11 digits instead of leaving overflow unformatted', () => {
    expect(maskPhone('1198765432199')).toBe('(11) 98765-4321');
  });
});
