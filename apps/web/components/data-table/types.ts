import '@tanstack/react-table';
import type { MessageKey, Translator } from '@/lib/i18n/translate';

export type FilterType = 'text' | 'boolean' | 'enum' | 'date' | 'number';

/**
 * One choice of an `enum` filter. A fixed option (a status) is worded by a
 * catalogue key, in the interface language; an option that is the company's
 * own data (a work order type, a technician) carries its name as it is.
 */
export type FilterOption = { value: string } & (
  { labelKey: MessageKey; label?: never } | { label: string; labelKey?: never }
);

export function filterOptionLabel(option: FilterOption, t: Translator): string {
  return option.labelKey ? t(option.labelKey) : option.label;
}

/**
 * Module augmentation, not a new type consumers import — declaring a
 * column's `filterType` here is what lets `ColumnFilter`/`FilterDrawer`
 * (Fase 5) pick the right widget automatically instead of each routine
 * hand-building filter UI per field. `enum` columns also carry `filterOptions`.
 */
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    filterType?: FilterType | undefined;
    filterOptions?: FilterOption[] | undefined;
    /** An `enum` filter whose options are searched on the server (`filterOptions` then names the chosen ones). */
    filterLoadOptions?: ((search: string) => Promise<FilterOption[]>) | undefined;
    /** Catalogue key of the column's name — for active-filter chips; falls back to a humanised column id. */
    labelKey?: MessageKey | undefined;
  }
}
