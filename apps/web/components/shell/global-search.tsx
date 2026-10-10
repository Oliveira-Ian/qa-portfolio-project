'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, Search, Star } from 'lucide-react';
import { Command, CommandEmpty, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { useT } from '@/lib/i18n/provider';
import { useFavorites } from '@/lib/navigation/favorites';
import type { SearchEntry } from '@/lib/navigation/nav';
import { cn } from '@/lib/utils';

/**
 * Every screen the account can actually reach in the area it is in — the shell
 * builds the entries from the same navigation it renders, so search can never
 * offer a screen the sidebar hides. Ctrl+Shift+F focuses it from anywhere.
 */
interface GlobalSearchProps {
  entries: SearchEntry[];
  /** The field collapses to an icon button when space is short (handoff § 6). */
  className?: string;
}

/** Wraps the substring of `text` matching `query` (case-insensitive) in a highlight span. */
function HighlightedLabel({ text, query }: { text: string; query: string }) {
  if (!query.trim()) {
    return <>{text}</>;
  }

  const index = text.toLowerCase().indexOf(query.toLowerCase());

  if (index === -1) {
    return <>{text}</>;
  }

  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-xs bg-accent-50 text-accent-600">
        {text.slice(index, index + query.length)}
      </mark>
      {text.slice(index + query.length)}
    </>
  );
}

export function GlobalSearch({ entries, className }: GlobalSearchProps) {
  const t = useT();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { isFavorite, toggleFavorite } = useFavorites();

  const labelled = useMemo(
    () =>
      entries.map((entry) => ({
        ...entry,
        label: t(entry.labelKey),
        context: entry.contextKey ? t(entry.contextKey) : '',
      })),
    [entries, t],
  );

  const results = useMemo(
    () =>
      query.trim()
        ? labelled.filter((entry) =>
            `${entry.label} ${entry.context}`.toLowerCase().includes(query.trim().toLowerCase()),
          )
        : [],
    [labelled, query],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  function navigateTo(href: string) {
    setOpen(false);
    router.push(href);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);

    if (!next) {
      setQuery('');
    }
  }

  return (
    <Command className="contents">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverAnchor asChild>
          <div
            className={cn(
              'flex h-9 w-full max-w-[520px] items-center gap-2 rounded-md border border-shell-border bg-shell-control px-3 text-shell-text-muted transition-colors duration-100 focus-within:border-shell-focus focus-within:text-white',
              className,
            )}
          >
            <Search className="size-4 shrink-0" aria-hidden="true" />
            {/*
              A plain native input, not cmdk's `CommandInput` — cmdk's own Input
              ties every external `value` change into its internal store, which
              (per its source) re-checks `document.activeElement` and can
              freeze the list when it lives apart from the Popover's portal.
              We do 100% of the filtering ourselves (`shouldFilter={false}` +
              `results` below); arrow-key/Enter navigation still works because
              that `onKeyDown` lives on the root `Command` element.
            */}
            <input
              ref={inputRef}
              type="text"
              // No `aria-controls`: it would need cmdk's auto-generated list id,
              // which `CommandList` always overrides and doesn't expose.
              // eslint-disable-next-line jsx-a11y/role-has-required-aria-props
              role="combobox"
              aria-expanded={open}
              aria-autocomplete="list"
              aria-label={t('shell.search.label')}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setOpen(true)}
              placeholder={t('shell.search.placeholder')}
              data-testid="global-search-input"
              className="h-auto min-w-0 flex-1 border-none bg-transparent p-0 text-sm text-white outline-none placeholder:text-shell-text-muted"
            />
            <kbd className="olv-data hidden shrink-0 rounded-xs border border-shell-border border-b-2 px-1.5 py-px text-[11px] text-shell-text-muted lg:inline-block">
              Ctrl Shift F
            </kbd>
          </div>
        </PopoverAnchor>

        <PopoverContent
          data-testid="global-search-dialog"
          align="center"
          sideOffset={8}
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="w-[var(--radix-popper-anchor-width)] gap-0 overflow-hidden p-0"
        >
          <CommandList data-testid="global-search-results">
            <CommandEmpty>
              {query.trim() ? t('shell.search.empty') : t('shell.search.prompt')}
            </CommandEmpty>

            {results.map((entry) => {
              const Icon = entry.icon;
              const favorite = isFavorite(entry.href);

              return (
                <CommandItem
                  key={entry.href}
                  value={entry.href}
                  data-testid="global-search-result"
                  onSelect={() => navigateTo(entry.href)}
                >
                  <Icon className="size-4 shrink-0 text-text-3" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">
                    <HighlightedLabel text={entry.label} query={query} />
                    {entry.context ? (
                      <span className="ml-2 text-xs text-text-3">{entry.context}</span>
                    ) : null}
                  </span>
                  <span className="olv-overline shrink-0 rounded-xs bg-neutral-light px-1.5 py-0.5 text-neutral-on">
                    {t('shell.search.screen')}
                  </span>
                  <button
                    type="button"
                    aria-label={t('shell.search.openNewTab')}
                    data-testid="global-search-result-open-new-tab"
                    className="rounded-sm p-1 text-text-3 hover:bg-foreground/5 hover:text-foreground"
                    onClick={(event) => {
                      event.stopPropagation();
                      window.open(entry.href, '_blank', 'noopener,noreferrer');
                    }}
                    onMouseDown={(event) => event.stopPropagation()}
                  >
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={
                      favorite ? t('shell.search.unfavorite') : t('shell.search.favorite')
                    }
                    data-testid="global-search-result-favorite"
                    className={cn(
                      'rounded-sm p-1 hover:bg-foreground/5',
                      favorite ? 'text-warning' : 'text-text-3 hover:text-foreground',
                    )}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleFavorite(entry.href);
                    }}
                    onMouseDown={(event) => event.stopPropagation()}
                  >
                    <Star
                      className={cn('size-3.5', favorite && 'fill-current')}
                      aria-hidden="true"
                    />
                  </button>
                </CommandItem>
              );
            })}
          </CommandList>
        </PopoverContent>
      </Popover>
    </Command>
  );
}
