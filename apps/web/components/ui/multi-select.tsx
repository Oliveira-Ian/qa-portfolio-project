'use client';

import { useState } from 'react';
import { ChevronsUpDown, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps extends Omit<
  React.ComponentPropsWithoutRef<'div'>,
  'onChange' | 'value'
> {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  /** Custom chip renderer for a selected option — falls back to a plain `Badge`. */
  renderTag?: (option: MultiSelectOption) => React.ReactNode;
}

/**
 * A multi-select dropdown with checkboxes and an incremental text filter —
 * same building blocks as `Combobox`/`GlobalSearch` (non-modal `Popover` +
 * `cmdk`'s `Command`). Selected options render as removable chips in the
 * trigger, which grows with the selection instead of clipping it.
 *
 * The trigger is a `<div role="button">`, not a `<button>` — each chip's
 * remove control is a real `<button>`, and a `<button>` cannot contain another
 * interactive `<button>` (invalid HTML, and two nested tab stops for screen
 * readers either way).
 */
export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'No results found.',
  renderTag,
  disabled,
  className,
  ...props
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.filter((option) => value.includes(option.value));
  const results = query.trim()
    ? options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  function toggle(optionValue: string) {
    onChange(
      value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue],
    );
  }

  function remove(optionValue: string) {
    onChange(value.filter((v) => v !== optionValue));
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);

    if (!next) {
      setQuery('');
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <div
          role="button"
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          data-slot="multi-select-trigger"
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setOpen((prev) => !prev);
            }
          }}
          className={cn(
            'flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
            disabled && 'pointer-events-none opacity-50',
            className,
          )}
          {...props}
        >
          {selected.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            selected.map((option) => (
              <span key={option.value} className="inline-flex items-center gap-1">
                {renderTag ? (
                  renderTag(option)
                ) : (
                  <Badge variant="outline" className="border-border text-foreground">
                    {option.label}
                  </Badge>
                )}
                {!disabled && (
                  <button
                    type="button"
                    aria-label={`Remove ${option.label}`}
                    className="rounded-sm p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={(event) => {
                      event.stopPropagation();
                      remove(option.value);
                    }}
                    onMouseDown={(event) => event.stopPropagation()}
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                )}
              </span>
            ))
          )}
          <ChevronsUpDown
            className="ml-auto size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-[var(--radix-popper-anchor-width)] gap-0 overflow-hidden p-0"
      >
        <Command>
          <div className="flex items-center border-b border-border px-3">
            <CommandInput
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder={searchPlaceholder}
            />
          </div>
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            {results.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={() => toggle(option.value)}
              >
                <Checkbox checked={value.includes(option.value)} className="pointer-events-none" />
                <span className="flex-1 truncate">{option.label}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
