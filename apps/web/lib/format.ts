/**
 * Locale-aware formatting in one place.
 *
 * `Intl` rather than hand-rolled templates: a hardcoded `dd/MM/yyyy` is wrong
 * for half the world and silently drifts from what the browser would do. The
 * formatters are built once at module scope — constructing an `Intl.*Format` is
 * expensive enough to matter inside a table row.
 */
const LOCALE = 'pt-BR';

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
});

const numberFormatter = new Intl.NumberFormat(LOCALE);

/**
 * Dates are stored as instants but read as calendar days, so they are formatted
 * in UTC — otherwise a birthday saved as `1990-01-01` shows as 31/12/1989 for
 * anyone west of Greenwich.
 */
export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date);
}

export function formatCount(value: number): string {
  return numberFormatter.format(value);
}

/** `2026-07-28` — what an `<input type="date">` expects. */
export function toDateInputValue(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  return value.slice(0, 10);
}

/** Falls back to an em dash so an empty cell still reads as deliberate. */
export function orDash(value: string | null | undefined): string {
  return value?.trim() ? value : '—';
}
