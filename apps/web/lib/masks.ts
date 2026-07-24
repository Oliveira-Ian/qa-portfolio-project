// Pure formatting helpers — mirror the legacy applyDocumentMask/applyPhoneMask
// (frontend/scripts/pages/person-form.js), just without touching the DOM.

export function maskDocument(value: string, documentType: 'CPF' | 'CNPJ'): string {
  const digits = value.replace(/\D/g, '');

  if (documentType === 'CPF') {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  if (documentType === 'CNPJ') {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  return digits;
}

export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}
