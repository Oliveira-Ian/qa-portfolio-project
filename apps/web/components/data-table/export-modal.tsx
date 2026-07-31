'use client';

import { useState } from 'react';
import type { Table } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface ExportColumn<TData> {
  key: string;
  label: string;
  getValue: (row: TData) => string;
}

interface ExportModalProps<TData> {
  table: Table<TData>;
  columns: ExportColumn<TData>[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  testIdPrefix: string;
}

interface WorkingColumn {
  key: string;
  included: boolean;
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

function downloadCsv(csv: string, fileName: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Column choice/order for the export, pre-filled from the grid's current
 * visible columns and order but edited independently of it — changing what
 * you export doesn't change what the grid shows. The rows exported are
 * `table.getSortedRowModel()` (filtered + sorted, not just the current
 * page) — per the spec, export reflects the grid's current configuration,
 * not only what's on screen.
 *
 * The parent remounts this component (a changing `key`) each time the
 * Export button is clicked, so the working column list is always seeded
 * fresh from the grid's *current* state without an effect reaching for it.
 */
export function ExportModal<TData>({
  table,
  columns,
  open,
  onOpenChange,
  fileName,
  testIdPrefix,
}: ExportModalProps<TData>) {
  const [working, setWorking] = useState<WorkingColumn[]>(() => {
    const order = table.getState().columnOrder;
    const visibility = table.getState().columnVisibility;
    const orderedKeys = order.length > 0 ? order : columns.map((column) => column.key);
    const knownKeys = new Set(columns.map((column) => column.key));

    return orderedKeys
      .filter((key) => knownKeys.has(key))
      .map((key) => ({ key, included: visibility[key] !== false }));
  });

  function labelFor(key: string): string {
    return columns.find((column) => column.key === key)?.label ?? key;
  }

  function move(index: number, direction: -1 | 1) {
    setWorking((current) => {
      const target = index + direction;

      if (target < 0 || target >= current.length) {
        return current;
      }

      const next = [...current];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  }

  function toggle(key: string) {
    setWorking((current) =>
      current.map((column) =>
        column.key === key ? { ...column, included: !column.included } : column,
      ),
    );
  }

  const includedCount = working.filter((column) => column.included).length;

  function handleExport() {
    const selected = working.filter((column) => column.included);
    const exportColumns = selected
      .map((column) => columns.find((candidate) => candidate.key === column.key))
      .filter((column): column is ExportColumn<TData> => column !== undefined);

    const rows = table.getSortedRowModel().rows.map((row) => row.original);
    const header = exportColumns.map((column) => csvEscape(column.label)).join(',');
    const lines = rows.map((row) =>
      exportColumns.map((column) => csvEscape(column.getValue(row))).join(','),
    );

    downloadCsv([header, ...lines].join('\n'), fileName);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid={`${testIdPrefix}-export-modal`} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export</DialogTitle>
        </DialogHeader>

        <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto">
          {working.map((item, index) => (
            <li key={item.key} className="flex items-center gap-2 rounded-md px-1.5 py-1">
              <Checkbox
                checked={item.included}
                onCheckedChange={() => toggle(item.key)}
                aria-label={`Include ${labelFor(item.key)}`}
                data-testid={`${testIdPrefix}-export-checkbox-${item.key}`}
              />
              <span className="flex-1 text-sm text-foreground">{labelFor(item.key)}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                disabled={index === 0}
                onClick={() => move(index, -1)}
                aria-label={`Move ${labelFor(item.key)} up`}
                data-testid={`${testIdPrefix}-export-move-up-${item.key}`}
              >
                <ArrowUp aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                disabled={index === working.length - 1}
                onClick={() => move(index, 1)}
                aria-label={`Move ${labelFor(item.key)} down`}
                data-testid={`${testIdPrefix}-export-move-down-${item.key}`}
              >
                <ArrowDown aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <Button
            type="button"
            onClick={handleExport}
            disabled={includedCount === 0}
            data-testid={`${testIdPrefix}-export-confirm`}
          >
            <Download aria-hidden="true" />
            Export CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
