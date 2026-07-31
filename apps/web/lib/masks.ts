// Pure formatting helpers — mirror the legacy applyDocumentMask/applyPhoneMask
// (frontend/scripts/pages/person-form.js), just without touching the DOM.
//
// Both mask progressively (every partial input gets *some* mask, not just a
// complete one) and truncate at the type's digit count — the previous
// fixed-length regexes only matched an exact digit count, so a 10-digit
// landline (`maskPhone`) came back completely unmasked, and typing past a
// document's length (`maskDocument`) left the overflow digits dangling
// unformatted after the mask.

function joinWithSeparators(parts: string[], separator: string): string {
  return parts.filter((part) => part.length > 0).join(separator);
}

export function maskDocument(value: string, documentType: 'CPF' | 'CNPJ'): string {
  const maxDigits = documentType === 'CPF' ? 11 : 14;
  const digits = value.replace(/\D/g, '').slice(0, maxDigits);

  if (documentType === 'CPF') {
    const grouped = joinWithSeparators(
      [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9)],
      '.',
    );
    const checkDigits = digits.slice(9, 11);

    return checkDigits ? `${grouped}-${checkDigits}` : grouped;
  }

  const grouped = joinWithSeparators(
    [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 8)],
    '.',
  );
  const branch = digits.slice(8, 12);
  const checkDigits = digits.slice(12, 14);

  let result = branch ? `${grouped}/${branch}` : grouped;

  if (checkDigits) {
    result += `-${checkDigits}`;
  }

  return result;
}

const MAX_PHONE_DIGITS = 11;

/**
 * A Brazilian phone number is 10 digits (landline: 2-digit area code + 4 + 4)
 * or 11 (mobile: area code + 5 + 4) — indistinguishable from the digits
 * typed so far until either the field is complete or an 11th digit arrives.
 * Formatted as a landline up to 10 digits; typing an 11th reflows the mask
 * to the mobile shape. Every masked-phone input behaves this way (bank
 * apps, IMask, vue-the-mask's `phone` preset) for the same reason.
 */
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, MAX_PHONE_DIGITS);

  if (digits.length === 0) {
    return '';
  }

  const areaCode = digits.slice(0, 2);

  if (digits.length <= 2) {
    return `(${areaCode}`;
  }

  const isMobile = digits.length > 10;
  const localLength = isMobile ? 5 : 4;
  const local = digits.slice(2, 2 + localLength);
  const rest = digits.slice(2 + localLength);

  return rest ? `(${areaCode}) ${local}-${rest}` : `(${areaCode}) ${local}`;
}

const MAX_TIME_DIGITS = 4;

/** Caps each half at its calendar-valid maximum — `93` isn't a minute. */
function clampTimeSegment(digits: string, max: number): string {
  return digits.length === 2 && Number(digits) > max ? String(max) : digits;
}

/** Progressive `HH:mm` mask, 24-hour clock — typing "1345" becomes "13:45". */
export function maskTime(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, MAX_TIME_DIGITS);

  if (digits.length === 0) {
    return '';
  }

  const hours = clampTimeSegment(digits.slice(0, 2), 23);

  if (digits.length <= 2) {
    return hours;
  }

  const minutes = clampTimeSegment(digits.slice(2, 4), 59);

  return `${hours}:${minutes}`;
}
