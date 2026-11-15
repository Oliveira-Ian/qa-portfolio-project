import type { Locale } from '../config';
import { flattenMessages, type FlatMessages } from '../translate';
import { en } from './en';
import { ptBR } from './pt-BR';

const flat: Record<Locale, FlatMessages> = {
  en: flattenMessages(en),
  'pt-BR': flattenMessages(ptBR),
};

/** The whole catalogue of one language, flattened for lookup. */
export function getMessages(locale: Locale): FlatMessages {
  return flat[locale];
}
