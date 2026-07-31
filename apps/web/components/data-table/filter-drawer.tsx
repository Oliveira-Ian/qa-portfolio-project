'use client';

import type { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { FilterField } from './filter-field';
import type { FilterOption, FilterType } from './types';

export interface FilterDrawerField {
  /** Column id — must match a column declared in the routine's `columns` array. */
  key: string;
  label: string;
  filterType: FilterType;
  options?: FilterOption[];
}

interface FilterDrawerProps<TData> {
  table: Table<TData>;
  fields: FilterDrawerField[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testIdPrefix: string;
}

/**
 * Every filterable field of a routine at once, in a side panel — the
 * structure (panel, Clear all/Close) is generic; `fields` is what makes it
 * Person's filters, or any other routine's. Each field writes into the same
 * `column.setFilterValue` the matching `ColumnFilter` popover uses, applying
 * live rather than on a separate submit.
 */
export function FilterDrawer<TData>({
  table,
  fields,
  open,
  onOpenChange,
  testIdPrefix,
}: FilterDrawerProps<TData>) {
  function clearAll() {
    // `table.resetColumnFilters()`, not a loop over `fields` — `fields` is
    // only the curated subset this drawer shows; a filter set from a
    // column's own quick `ColumnFilter` on a column outside that subset
    // (e.g. `city`) needs clearing too, or "Clear all" doesn't actually
    // mean all.
    table.resetColumnFilters();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent data-testid={`${testIdPrefix}-filter-drawer`}>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4">
          {fields.map((field) => {
            const column = table.getColumn(field.key);

            if (!column) {
              return null;
            }

            return (
              <FilterField
                key={field.key}
                filterType={field.filterType}
                label={field.label}
                options={field.options}
                value={column.getFilterValue()}
                onChange={(value) => column.setFilterValue(value)}
                testId={`${testIdPrefix}-filter-drawer-${field.key}`}
              />
            );
          })}
        </div>
        <SheetFooter className="flex-row justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={clearAll}
            data-testid={`${testIdPrefix}-filter-drawer-clear`}
          >
            Clear all
          </Button>
          <SheetClose asChild>
            <Button type="button" data-testid={`${testIdPrefix}-filter-drawer-close`}>
              Close
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
