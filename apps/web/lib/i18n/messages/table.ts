/**
 * The shared listing infrastructure (`components/data-table/`): toolbar, filters,
 * export, column customisation, selection. Each routine's own words — its column
 * names, its empty state — live in its domain (`erp.*`).
 *
 * `tableEn` is the shape; `tablePtBR` is typed against it.
 */
export const tableEn = {
  loading: 'Loading',
  selectAll: 'Select all rows on this page',
  selectRow: 'Select {name}',
  rowActions: 'Row actions',
  search: { placeholder: 'Search…', clear: 'Clear search' },
  toolbar: {
    export: 'Export',
    customize: 'Customize',
    refresh: 'Refresh',
    filters: 'Filters',
  },
  selection: { count: '{count} selected', clear: 'Clear' },
  filters: {
    title: 'Filters',
    clearAll: 'Clear all',
    close: 'Close',
    column: 'Filter {label}',
    any: 'Any',
    yes: 'Yes',
    no: 'No',
    from: '{label} from',
    to: '{label} to',
    minimum: '{label} minimum',
    maximum: '{label} maximum',
    min: 'Min',
    max: 'Max',
    remove: 'Remove {label} filter',
    fromDate: 'From {value}',
    untilDate: 'Until {value}',
  },
  export: {
    title: 'Export',
    include: 'Include {label}',
    moveUp: 'Move {label} up',
    moveDown: 'Move {label} down',
    confirm: 'Export CSV',
  },
  customize: {
    title: 'Customize columns',
    show: 'Show {label}',
    restore: 'Restore default',
    save: 'Save',
    saved: 'Column preferences saved',
    saveFailed: 'Could not save your column preferences',
  },
};

type DeepString<T> = { [K in keyof T]: T[K] extends string ? string : DeepString<T[K]> };

export const tablePtBR: DeepString<typeof tableEn> = {
  loading: 'Carregando',
  selectAll: 'Selecionar todas as linhas desta página',
  selectRow: 'Selecionar {name}',
  rowActions: 'Ações da linha',
  search: { placeholder: 'Buscar…', clear: 'Limpar busca' },
  toolbar: {
    export: 'Exportar',
    customize: 'Personalizar',
    refresh: 'Atualizar',
    filters: 'Filtros',
  },
  selection: {
    count: '{count, plural, one {# selecionado} other {# selecionados}}',
    clear: 'Limpar',
  },
  filters: {
    title: 'Filtros',
    clearAll: 'Limpar tudo',
    close: 'Fechar',
    column: 'Filtrar {label}',
    any: 'Qualquer',
    yes: 'Sim',
    no: 'Não',
    from: '{label}: de',
    to: '{label}: até',
    minimum: '{label}: mínimo',
    maximum: '{label}: máximo',
    min: 'Mín.',
    max: 'Máx.',
    remove: 'Remover o filtro {label}',
    fromDate: 'A partir de {value}',
    untilDate: 'Até {value}',
  },
  export: {
    title: 'Exportar',
    include: 'Incluir {label}',
    moveUp: 'Mover {label} para cima',
    moveDown: 'Mover {label} para baixo',
    confirm: 'Exportar CSV',
  },
  customize: {
    title: 'Personalizar colunas',
    show: 'Mostrar {label}',
    restore: 'Restaurar padrão',
    save: 'Salvar',
    saved: 'Preferências de colunas salvas',
    saveFailed: 'Não foi possível salvar suas preferências de colunas',
  },
};
