'use client';

import { useTransition } from 'react';
import { Bell, Info, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOutAction } from '@/app/(dashboard)/_actions/sign-out';

interface UserMenuProps {
  name: string;
  email: string;
}

/** First letter of the signed-in user — from the session now, not localStorage. */
function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || 'U';
}

export function UserMenu({ name, email }: UserMenuProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild data-testid="header-user-menu">
        <button
          type="button"
          className="flex items-center gap-2 rounded-md p-1 transition-colors hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          aria-label={`Account menu for ${name}`}
        >
          <Avatar className="size-8" data-testid="header-user-avatar">
            <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
              {initialOf(name)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56" data-testid="header-user-dropdown">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate text-sm font-medium">{name}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Deliberately inert, like About below — no notification feed exists
            yet, so this is the placeholder that establishes the affordance
            (icon + counter) for when one does. The badge always reads 0. */}
        <DropdownMenuItem data-testid="header-dropdown-notifications">
          <Bell aria-hidden="true" />
          Notifications
          <Badge variant="outline" className="ml-auto text-muted-foreground">
            0
          </Badge>
        </DropdownMenuItem>

        {/* Deliberately inert: `docs/design/layouts/dashboard.md` specifies
            About as a placeholder with no action, and it closes the menu like
            any other item. */}
        <DropdownMenuItem data-testid="header-dropdown-about">
          <Info aria-hidden="true" />
          About
        </DropdownMenuItem>

        <DropdownMenuItem
          data-testid="header-dropdown-signout"
          disabled={isPending}
          onSelect={() => startTransition(() => signOutAction())}
        >
          <LogOut aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
