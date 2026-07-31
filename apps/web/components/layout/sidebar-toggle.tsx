'use client';

import { PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SidebarMode } from '@/lib/navigation/sidebar-preference';

interface SidebarToggleProps {
  mode: SidebarMode;
  onToggle: () => void;
}

/**
 * Lives at the top of the rail it controls now, not the header — reachable
 * even when the sidebar is collapsed to icons only, which a header-mounted
 * toggle wouldn't be if the sidebar could ever fully hide.
 */
export function SidebarToggle({ mode, onToggle }: SidebarToggleProps) {
  const isExpanded = mode === 'expanded';

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      aria-label={isExpanded ? 'Collapse navigation' : 'Expand navigation'}
      aria-expanded={isExpanded}
      data-testid="dashboard-sidebar-toggle"
      onClick={onToggle}
    >
      <PanelLeft aria-hidden="true" />
    </Button>
  );
}
