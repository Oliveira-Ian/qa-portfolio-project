'use client';

import type { LucideIcon } from 'lucide-react';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface RowAction {
  key: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  disabled?: boolean;
  variant?: 'default' | 'destructive';
  testId?: string;
}

interface RowActionsMenuProps {
  actions: RowAction[];
  testId: string;
}

/**
 * The per-row "⋮" trigger — always visible and keyboard-operable, unlike a
 * right-click-only menu. `DataTable`'s `rowActions` prop wires this same
 * `RowAction[]` into a right-click `ContextMenu` on the row itself (see
 * `data-table.tsx`), so both paths open the identical list of actions.
 *
 * `stopPropagation` on the trigger keeps a click here from also toggling the
 * row's own selection — the same reason `DataTable`'s selection checkbox
 * cell does it.
 */
export function RowActionsMenu({ actions, testId }: RowActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Row actions"
          data-testid={testId}
          onClick={(event) => event.stopPropagation()}
        >
          <MoreVertical aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.key}
            disabled={action.disabled ?? false}
            variant={action.variant ?? 'default'}
            onSelect={action.onSelect}
            data-testid={action.testId}
          >
            <action.icon aria-hidden="true" />
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
