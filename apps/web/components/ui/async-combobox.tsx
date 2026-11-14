'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useT } from '@/lib/i18n/provider';
import { cn } from '@/lib/utils';
import type { ComboboxOption } from './combobox';

export interface AsyncComboboxOption extends ComboboxOption {
  /** A second line under the label: a document, a code. */
  description?: string | null;
}

interface AsyncComboboxProps extends Omit<
  React.ComponentPropsWithoutRef<'button'>,
  'onChange' | 'value'
> {
  value: string | null;
  /** The label of the current value — the options loaded may not include it. */
  selectedLabel?: string | null;
  /** Fetches the options matching what was typed (a Server Action, usually). */
  loadOptions: (search: string) => Promise<AsyncComboboxOption[]>;
  onChange: (value: string, option: AsyncComboboxOption) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
}

/**
 * `Combobox` for a list too long to send whole — customers, equipment,
 * technicians: what is typed is searched on the server (debounced), and the
 * popover shows what comes back. Same trigger and keyboard behavior as
 * `Combobox`.
 */
export function AsyncCombobox({
  value,
  selectedLabel,
  loadOptions,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled,
  className,
  ...props
}: AsyncComboboxProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<AsyncComboboxOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const loadRef = useRef(loadOptions);

  useEffect(() => {
    loadRef.current = loadOptions;
  }, [loadOptions]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let isCurrent = true;
    const timer = setTimeout(() => {
      setIsLoading(true);
      loadRef
        .current(query.trim())
        .then((result) => {
          if (isCurrent) {
            setOptions(result);
          }
        })
        .catch(() => {
          if (isCurrent) {
            setOptions([]);
          }
        })
        .finally(() => {
          if (isCurrent) {
            setIsLoading(false);
          }
        });
    }, 250);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [open, query]);

  function handleOpenChange(next: boolean) {
    setOpen(next);

    if (!next) {
      setQuery('');
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          data-slot="combobox-trigger"
          className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:border-border disabled:bg-background disabled:text-text-muted aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
            className,
          )}
          {...props}
        >
          <span className={cn('truncate text-left', !selectedLabel && 'text-muted-foreground')}>
            {value && selectedLabel ? selectedLabel : (placeholder ?? t('common.select'))}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-[var(--radix-popper-anchor-width)] gap-0 overflow-hidden p-0"
      >
        <Command shouldFilter={false}>
          <div className="flex items-center border-b border-border px-3">
            <CommandInput
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder={searchPlaceholder ?? t('table.search.placeholder')}
            />
            {isLoading ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-text-3" aria-hidden="true" />
            ) : null}
          </div>
          <CommandList aria-busy={isLoading}>
            {isLoading && options.length === 0 ? null : (
              <CommandEmpty>{emptyText ?? t('common.noResults')}</CommandEmpty>
            )}
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={() => {
                  onChange(option.value, option);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    'size-4 shrink-0',
                    option.value === value ? 'opacity-100' : 'opacity-0',
                  )}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{option.label}</span>
                  {option.description ? (
                    <span className="block truncate text-xs text-text-3">{option.description}</span>
                  ) : null}
                </span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
