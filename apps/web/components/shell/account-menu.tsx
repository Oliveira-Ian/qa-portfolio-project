'use client';

import { useTransition } from 'react';
import { LogOut, UserRound } from 'lucide-react';
import { signOutAction } from '@/app/_actions/sign-out';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useT } from '@/lib/i18n/provider';
import { LanguageSwitch } from './language-switch';

interface AccountMenuProps {
  name: string;
  email: string;
}

/**
 * The account menu, where the language lives (handoff § 5): who is signed in,
 * the language switch, and sign out. The avatar is the Platform's gold in every
 * product — it belongs to the global bar, not to the product the user is in.
 *
 * The two inert rows the old menu carried ("Notifications 0", "About") are gone:
 * they did nothing and the design does not have them.
 */
export function AccountMenu({ name, email }: AccountMenuProps) {
  const t = useT();
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-testid="header-user-menu"
          aria-label={t('shell.account.menuFor', { name })}
          className="grid size-8 place-items-center rounded-full bg-[var(--olv-gold-300)] text-[var(--olv-navy-700)] outline-none transition-[box-shadow] duration-100 hover:ring-2 hover:ring-white/30 focus-visible:ring-focus-shell"
        >
          <UserRound className="size-[18px]" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72 min-w-72" data-testid="header-user-dropdown">
        <DropdownMenuLabel className="flex flex-col gap-0.5 px-2.5 py-2">
          <span
            className="truncate text-sm font-semibold text-foreground"
            data-testid="header-user-name"
          >
            {name}
          </span>
          <span className="olv-data truncate font-normal text-text-3">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="flex items-center justify-between gap-3 px-2.5 py-2">
          <span className="olv-overline text-text-3">{t('common.language')}</span>
          <LanguageSwitch tone="light" labels="short" />
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          data-testid="header-dropdown-signout"
          disabled={isPending}
          onSelect={() => startTransition(() => signOutAction())}
        >
          <LogOut aria-hidden="true" />
          {t('shell.account.signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
