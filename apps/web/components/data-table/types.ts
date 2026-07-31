import '@tanstack/react-table';

export type FilterType = 'text' | 'boolean' | 'enum' | 'date' | 'number';

export interface FilterOption {
  label: string;
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
    /** Shown in `GridCustomizationModal`/`ExportModal` column pickers — falls back to the column id. */
    label?: string | undefined;
  }
}
