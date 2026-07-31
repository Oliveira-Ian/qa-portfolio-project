'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, Search, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import type { RoutinePath } from '@/lib/navigation/catalog';
import { useFavorites } from '@/lib/navigation/favorites';
import { cn } from '@/lib/utils';

/**
 * Every screen the account can actually see, not the whole catalog — the
 * caller (`app-header.tsx`) already resolved `filterCatalogForAccount()` for
 * the sidebar, so search reuses the same access rules by only ever being
 * handed routines from that pruned tree.
 */
interface GlobalSearchProps {
  routines: RoutinePath[];
}

function matchesQuery(entry: RoutinePath, query: string): boolean {
  const haystack =
    `${entry.routine.label} ${entry.group.label} ${entry.module.label}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
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
      <mark className="rounded-xs bg-primary-light text-primary">
        {text.slice(index, index + query.length)}
      </mark>
      {text.slice(index + query.length)}
    </>
  );
}

export function GlobalSearch({ routines }: GlobalSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { isFavorite, toggleFavorite } = useFavorites();

  const results = useMemo(
    () => (query.trim() ? routines.filter((entry) => matchesQuery(entry, query)) : []),
    [routines, query],
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
          <div className="flex h-10 w-full max-w-3xl items-center gap-2 rounded-md border border-white/15 bg-white/5 px-4 text-header-foreground-muted transition-colors focus-within:bg-white/10 focus-within:text-header-foreground">
            <Search className="size-4 shrink-0" aria-hidden="true" />
            {/*
              A plain native input, not cmdk's `CommandInput` — cmdk's own Input
              ties every external `value` change into its internal store, which
              (per its source) re-checks `document.activeElement` and can
              re-focus itself whenever the highlighted item changes, a heuristic
              built for Input+List living next to each other, not split across
              this Popover's portal. That produced an intermittent "stops
              filtering" freeze. We already do 100% of the filtering ourselves
              (`shouldFilter={false}` + `results` below), and arrow-key/Enter
              navigation still works because that `onKeyDown` lives on the root
              `Command` element, which wraps this input too — so nothing is lost
              by not using cmdk's own Input here.
            */}
            <input
              ref={inputRef}
              type="text"
              // No `aria-controls`: it would need cmdk's internally auto-generated
              // list id, which `CommandList` always overrides and doesn't expose.
              // eslint-disable-next-line jsx-a11y/role-has-required-aria-props
              role="combobox"
              aria-expanded={open}
              aria-autocomplete="list"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setOpen(true)}
              placeholder="Search…"
              data-testid="global-search-input"
              className="h-auto flex-1 border-none bg-transparent p-0 text-sm text-header-foreground outline-none placeholder:text-header-foreground-muted"
            />
            <kbd className="tabular hidden shrink-0 rounded-sm border border-white/15 bg-white/5 px-1.5 py-0.5 text-[0.6875rem] sm:inline-block">
              Ctrl+Shift+F
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
              {query.trim() ? 'No screens found.' : 'Start typing to search…'}
            </CommandEmpty>

            {results.map((entry) => {
              const Icon = entry.module.icon;
              const favorite = isFavorite(entry.href);

              return (
                <CommandItem
                  key={entry.href}
                  value={entry.href}
                  data-testid="global-search-result"
                  onSelect={() => navigateTo(entry.href)}
                >
                  <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">
                    <HighlightedLabel text={entry.routine.label} query={query} />
                    <span className="ml-2 text-xs text-muted-foreground">
                      {entry.module.label} / {entry.group.label}
                    </span>
                  </span>
                  <Badge
                    variant="outline"
                    className="eyebrow shrink-0 border-border text-muted-foreground"
                  >
                    Screen
                  </Badge>
                  <button
                    type="button"
                    aria-label="Open in new tab"
                    data-testid="global-search-result-open-new-tab"
                    className={cn(
                      'rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
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
                    aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
                    data-testid="global-search-result-favorite"
                    className={cn(
                      'rounded-sm p-1 hover:bg-muted',
                      favorite ? 'text-signal' : 'text-muted-foreground hover:text-foreground',
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
