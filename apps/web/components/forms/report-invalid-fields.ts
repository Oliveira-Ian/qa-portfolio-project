'use client';

import { toast } from 'sonner';
import type { Translator } from '@/lib/i18n/translate';

/** The visible label of a control, without the required-field asterisk. */
function labelOf(field: HTMLElement): string {
  const label = field.id ? document.querySelector(`label[for="${CSS.escape(field.id)}"]`) : null;

  return (label?.textContent ?? '').replace(/\*\s*$/, '').trim();
}

/** The field's own error text — the screen-reader-only `FormMessage` its control describes itself with. */
function messageOf(field: HTMLElement): string {
  const ids = (field.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);

  for (const id of ids) {
    const text = document.getElementById(id)?.closest('[data-slot="form-message"]')?.textContent;

    if (text) {
      return text.trim();
    }
  }

  return '';
}

/**
 * A failed save says what is wrong in a toast — "Name: Name is required", plus
 * how many more fields need attention — while the fields themselves only turn
 * red, so nothing moves on the page (docs/design/components/forms.md). The form
 * may be long, so the first invalid field is also brought into view and focused:
 * react-hook-form focuses the controls that forward their ref, this covers the
 * custom ones that do not (a chip group, a combobox).
 */
export function reportInvalidFields(errorCount: number, t: Translator): void {
  requestAnimationFrame(() => {
    const field = document.querySelector<HTMLElement>('form [aria-invalid="true"]');
    const label = field ? labelOf(field) : '';
    const message = field ? messageOf(field) : '';
    const title = message ? (label ? `${label}: ${message}` : message) : t('common.fixErrors');

    toast.error(title, {
      ...(errorCount > 1
        ? { description: t('common.moreFieldErrors', { count: errorCount - 1 }) }
        : {}),
    });

    field?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    field?.focus({ preventScroll: true });
  });
}
