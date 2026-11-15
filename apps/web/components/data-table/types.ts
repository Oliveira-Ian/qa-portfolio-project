import '@tanstack/react-table';
import type { MessageKey } from '@/lib/i18n/translate';

export type FilterType = 'text' | 'boolean' | 'enum' | 'date' | 'number';

export interface FilterOption {
  /** The option's wording, as a catalogue key — a filter is shown in the interface language. */
  labelKey: MessageKey;
  value: string;
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
    /** Catalogue key of the column's name — for active-filter chips; falls back to a humanised column id. */
    labelKey?: MessageKey | undefined;
  }
}
