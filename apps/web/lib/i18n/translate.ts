import type { Locale } from './config';
import type { Messages } from './messages/en';

/** Every leaf of a nested catalogue as a dotted key: `auth.signIn.title`. */
type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type MessageKey = Leaves<Messages>;

export type TranslateVars = Record<string, string | number>;

export type Translator = (key: MessageKey, vars?: TranslateVars) => string;

export type FlatMessages = Record<string, string>;

/** Catalogues are nested by domain for humans and flat for lookup. */
export function flattenMessages(tree: object, prefix = ''): FlatMessages {
  const flat: FlatMessages = {};

  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      flat[path] = value;
    } else if (value && typeof value === 'object') {
      Object.assign(flat, flattenMessages(value, path));
    }
  }

  return flat;
}

const PLURAL_PATTERN = /\{(\w+),\s*plural,\s*((?:[^{}]|\{[^{}]*\})*)\}/g;
const PLURAL_BRANCH = /(\w+|=\d+)\s*\{([^{}]*)\}/g;

/**
 * The two pieces of ICU the catalogues use, and nothing else: named variables
 * (`{name}`) and plurals (`{count, plural, one {# member} other {# members}}`).
 * Sentences are always whole messages with variables — never concatenated — so
 * a language can reorder them (design handoff § 7).
 */
export function formatMessage(template: string, locale: Locale, vars: TranslateVars = {}): string {
  const numberFormat = new Intl.NumberFormat(locale);
  const pluralRules = new Intl.PluralRules(locale);

  const withPlurals = template.replace(PLURAL_PATTERN, (_match, name: string, body: string) => {
    const count = Number(vars[name] ?? 0);
    const branches = new Map<string, string>();

    for (const branch of body.matchAll(PLURAL_BRANCH)) {
      branches.set(branch[1] ?? '', branch[2] ?? '');
    }

    const chosen =
      branches.get(`=${count}`) ?? branches.get(pluralRules.select(count)) ?? branches.get('other');

    return (chosen ?? '').replaceAll('#', numberFormat.format(count));
  });

  return withPlurals.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

/**
 * A missing key renders the key itself — loud in development, and TypeScript
 * already refuses an unknown one. Both catalogues are checked against the same
 * shape, so a key present in English is present in Portuguese.
 */
export function createTranslator(locale: Locale, messages: FlatMessages): Translator {
  return (key, vars) => {
    const template = messages[key];

    return template === undefined ? key : formatMessage(template, locale, vars);
  };
}
