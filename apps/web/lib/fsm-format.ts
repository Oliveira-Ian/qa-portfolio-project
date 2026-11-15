import { BUSINESS_TIME_ZONE } from '@oliveira/schemas';
import type { Translator } from '@/lib/i18n/translate';

/*
 * Short dates, times and durations of the Oliveira FSM's screens. Always in
 * the business time zone, so the server and the browser render the same text.
 * Anything relative to "now" takes `now` as an argument — the page passes the
 * server's, so a client component never computes a different one on hydration.
 */

const cache = new Map<string, Intl.DateTimeFormat>();

function formatter(locale: string, key: string, options: Intl.DateTimeFormatOptions) {
  const id = `${locale}|${key}`;
  let value = cache.get(id);

  if (!value) {
    value = new Intl.DateTimeFormat(locale, { ...options, timeZone: BUSINESS_TIME_ZONE });
    cache.set(id, value);
  }

  return value;
}

const valid = (iso: string | null | undefined): Date | null => {
  if (!iso) {
    return null;
  }
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** "Nov 14" / "14 de nov." */
export function formatShortDate(iso: string | null | undefined, locale: string): string {
  const date = valid(iso);
  return date ? formatter(locale, 'md', { month: 'short', day: 'numeric' }).format(date) : '—';
}

/** "09:00" */
export function formatTime(iso: string | null | undefined, locale: string): string {
  const date = valid(iso);
  return date
    ? formatter(locale, 'hm', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date)
    : '—';
}

/** "Nov 14 · 09:00" */
export function formatShortDateTime(iso: string | null | undefined, locale: string): string {
  return valid(iso) ? `${formatShortDate(iso, locale)} · ${formatTime(iso, locale)}` : '—';
}

/** "Sat, Nov 14" */
export function formatWeekdayDate(iso: string | null | undefined, locale: string): string {
  const date = valid(iso);
  return date
    ? formatter(locale, 'wmd', { weekday: 'short', month: 'short', day: 'numeric' }).format(date)
    : '—';
}

/** "Saturday, November 14" — a day heading. */
export function formatLongDay(iso: string, locale: string): string {
  const date = valid(iso);
  return date
    ? formatter(locale, 'wlong', { weekday: 'long', month: 'long', day: 'numeric' }).format(date)
    : '—';
}

/** `yyyy-mm-dd` of an instant in the business time zone — to group by day. */
export function businessDay(iso: string): string {
  const parts = formatter('en-CA', 'ymd', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(new Date(iso))
    .reduce<Record<string, string>>((acc, part) => ({ ...acc, [part.type]: part.value }), {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** "45 min", "2 h", "2 h 30 min". */
export function formatDuration(minutes: number | null | undefined, t: Translator): string {
  if (minutes === null || minutes === undefined || minutes <= 0) {
    return '—';
  }
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);

  if (hours === 0) {
    return t('fsmUi.common.minutesShort', { count: rest });
  }
  return rest === 0
    ? t('fsmUi.common.hoursShort', { count: hours })
    : t('fsmUi.common.hoursMinutesShort', { hours, minutes: rest });
}

/** "3 d", "8 h", "40 min" — a span between two instants, rounded to its largest unit. */
export function formatSpan(milliseconds: number, t: Translator): string {
  const minutes = Math.max(1, Math.round(Math.abs(milliseconds) / 60_000));
  if (minutes < 60) {
    return t('fsmUi.common.minutesShort', { count: minutes });
  }
  const hours = Math.round(minutes / 60);
  return hours < 24
    ? t('fsmUi.common.hoursShort', { count: hours })
    : t('fsmUi.common.daysShort', { count: Math.round(hours / 24) });
}

export interface DueSignal {
  tone: 'critical' | 'warning' | 'neutral';
  text: string;
}

/**
 * How the due date reads next to a work order: "3 d late" (critical), "Due
 * today 18:00 · 8 h left" (warning), "due in 1 d" (warning within two days),
 * else the date. `null` without a due date or once the work order is finished.
 */
export function dueSignal(
  dueAt: string | null,
  now: string,
  isFinished: boolean,
  t: Translator,
  locale: string,
): DueSignal | null {
  const due = valid(dueAt);
  if (!due || isFinished) {
    return null;
  }
  const diff = due.getTime() - new Date(now).getTime();

  if (diff < 0) {
    return { tone: 'critical', text: t('fsmUi.common.lateBy', { time: formatSpan(diff, t) }) };
  }
  if (businessDay(due.toISOString()) === businessDay(now)) {
    return {
      tone: 'warning',
      text: `${t('fsmUi.common.dueToday', { time: formatTime(dueAt, locale) })} · ${t('fsmUi.common.leftIn', { time: formatSpan(diff, t) })}`,
    };
  }
  if (diff < 48 * 60 * 60_000) {
    return { tone: 'warning', text: t('fsmUi.common.dueIn', { time: formatSpan(diff, t) }) };
  }
  return { tone: 'neutral', text: formatShortDate(dueAt, locale) };
}
