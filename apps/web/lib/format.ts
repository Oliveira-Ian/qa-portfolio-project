/**
 * Locale-aware formatting in one place.
 *
 * `Intl` rather than hand-rolled templates: a hardcoded `dd/MM/yyyy` is wrong
 * for half the world and silently drifts from what the browser would do. The
 * formatters are built once at module scope — constructing an `Intl.*Format` is
 * expensive enough to matter inside a table row.
 */
export const LOCALE = 'pt-BR';

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

const currencyFormatter = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'BRL' });

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

export function formatCurrency(value: number | null | undefined): string {
  return typeof value === 'number' && !Number.isNaN(value) ? currencyFormatter.format(value) : '—';
}

/**
 * Turns whatever digits have been typed so far into an amount, treating them
 * as the smallest unit (cents, for `decimalScale=2`) — the same
 * type-and-it-shifts-left UX every masked amount input uses: typing "1234"
 * into a currency field grows 0,12 → 12,34 digit by digit instead of the user
 * having to place a decimal point themselves.
 */
export function parseDigitsToAmount(raw: string, decimalScale: number): number | null {
  const digits = raw.replace(/\D/g, '');

  if (!digits) {
    return null;
  }

  return Number(digits) / 10 ** decimalScale;
}

/** `2026-07-28` — what an `<input type="date">` expects. */
export function toDateInputValue(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  return value.slice(0, 10);
}

/**
 * `2026-07-28` → a local calendar-day `Date` (midnight in the browser's own
 * timezone) — what `DatePicker`/`DateRangePicker` hand `react-day-picker`,
 * which renders "today" and month grids in local time. Parsing through
 * `new Date("2026-07-28")` instead would read it as UTC midnight, which is
 * the previous day west of Greenwich — the same class of bug `formatDate`'s
 * own `timeZone: 'UTC'` works around for the opposite direction.
 */
export function parseIsoDate(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return undefined;
  }

  const [, year, month, day] = match.map(Number);
  const date = new Date(year!, month! - 1, day!);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** The inverse of `parseIsoDate` — a local calendar-day `Date` back to `yyyy-MM-dd`. */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/** Falls back to an em dash so an empty cell still reads as deliberate. */
export function orDash(value: string | null | undefined): string {
  return value?.trim() ? value : '—';
}
