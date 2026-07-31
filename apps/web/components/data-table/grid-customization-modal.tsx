'use client';

import { move } from '@dnd-kit/helpers';
import { DragDropProvider } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';
import type { Table } from '@tanstack/react-table';
import type { GridColumnPreferenceItem } from '@oliveira/schemas';
import { ArrowDown, ArrowUp, GripVertical, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface CustomizableColumn {
  key: string;
  label: string;
  /** Whether this column ships visible before any account customizes it — what "Restore default" returns to. Defaults to `true`. */
  defaultVisible?: boolean;
}

interface GridCustomizationModalProps<TData> {
  table: Table<TData>;
  columns: CustomizableColumn[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Persists the choice (a Server Action call, in practice) — the modal itself never talks to the API. */
  onSave: (columns: GridColumnPreferenceItem[]) => void | Promise<void>;
  testIdPrefix: string;
}

/**
 * A drag handle (mouse/touch) plus the ↑/↓ buttons (keyboard, screen
 * readers) both write the same `move`/`table.setColumnOrder` — dragging is a
 * convenience layer over the fully keyboard-accessible path, never a
 * replacement for it.
 */
function SortableColumnRow({
  id,
  index,
  children,
}: {
  id: string;
  index: number;
  children: React.ReactNode;
}) {
  const { ref, handleRef, isDragging } = useSortable({ id, index });

  return (
    <li
      ref={ref}
      className={cn('flex items-center gap-1 rounded-md px-1.5 py-1', isDragging && 'opacity-50')}
    >
      <div
        ref={handleRef}
        aria-hidden="true"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical className="size-4" aria-hidden="true" />
      </div>
      {children}
    </li>
  );
}

/**
 * Show/hide + reorder (drag handle, or the ↑/↓ buttons kept for keyboard and
 * screen-reader users) for every column the routine declared.
 *
 * Every action here writes straight to the live `table`'s own
 * `columnOrder`/`columnVisibility` state — there's no separate staging copy
 * to keep in sync with it (which would need an effect just to seed itself
 * whenever the dialog opens). The grid previews changes as you make them;
 * "Save" only adds persisting the result via `onSave`, "Restore default"
 * resets the table state back to every declared column, visible, in
 * declaration order.
 */
export function GridCustomizationModal<TData>({
  table,
  columns,
  open,
  onOpenChange,
  onSave,
  testIdPrefix,
}: GridCustomizationModalProps<TData>) {
  const order = table.getState().columnOrder;
  const visibility = table.getState().columnVisibility;
  const knownKeys = new Set(columns.map((column) => column.key));
  // Structural columns the routine didn't declare here (e.g. a row-actions
  // column) are never shown as a toggleable row — they always render, at
  // whatever position `DataTable` puts them.
  const orderedKeys = (order.length > 0 ? order : columns.map((column) => column.key)).filter(
    (key) => knownKeys.has(key),
  );
  const items: GridColumnPreferenceItem[] = orderedKeys.map((key) => ({
    key,
    visible: visibility[key] !== false,
  }));
  const visibleCount = items.filter((item) => item.visible).length;

  function labelFor(key: string): string {
    return columns.find((column) => column.key === key)?.label ?? key;
  }

  function moveByStep(index: number, direction: -1 | 1) {
    const target = index + direction;

    if (target < 0 || target >= orderedKeys.length) {
      return;
    }

    const next = [...orderedKeys];
    [next[index], next[target]] = [next[target]!, next[index]!];
    table.setColumnOrder(next);
  }

  function toggle(key: string, currentlyVisible: boolean) {
    // At least one column must stay visible — an all-hidden grid has nothing left to show.
    if (currentlyVisible && visibleCount <= 1) {
      return;
    }

    table.setColumnVisibility((current) => ({ ...current, [key]: !currentlyVisible }));
  }

  function restoreDefault() {
    table.setColumnOrder(columns.map((column) => column.key));
    table.setColumnVisibility(
      Object.fromEntries(columns.map((column) => [column.key, column.defaultVisible ?? true])),
    );
  }

  async function handleSave() {
    await onSave(items);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid={`${testIdPrefix}-customize-modal`} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Customize columns</DialogTitle>
        </DialogHeader>

        <DragDropProvider
          onDragEnd={(event) => {
            if (event.canceled) {
              return;
            }

            table.setColumnOrder(move(orderedKeys, event));
          }}
        >
          <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto">
            {items.map((item, index) => (
              <SortableColumnRow key={item.key} id={item.key} index={index}>
                <Checkbox
                  checked={item.visible}
                  onCheckedChange={() => toggle(item.key, item.visible)}
                  aria-label={`Show ${labelFor(item.key)}`}
                  data-testid={`${testIdPrefix}-customize-checkbox-${item.key}`}
                />
                <span className="flex-1 text-sm text-foreground">{labelFor(item.key)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={index === 0}
                  onClick={() => moveByStep(index, -1)}
                  aria-label={`Move ${labelFor(item.key)} up`}
                  data-testid={`${testIdPrefix}-customize-move-up-${item.key}`}
                >
                  <ArrowUp aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={index === items.length - 1}
                  onClick={() => moveByStep(index, 1)}
                  aria-label={`Move ${labelFor(item.key)} down`}
                  data-testid={`${testIdPrefix}-customize-move-down-${item.key}`}
                >
                  <ArrowDown aria-hidden="true" />
                </Button>
              </SortableColumnRow>
            ))}
          </ul>
        </DragDropProvider>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={restoreDefault}
            data-testid={`${testIdPrefix}-customize-restore`}
          >
            <RotateCcw aria-hidden="true" />
            Restore default
          </Button>
          <Button type="button" onClick={handleSave} data-testid={`${testIdPrefix}-customize-save`}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
