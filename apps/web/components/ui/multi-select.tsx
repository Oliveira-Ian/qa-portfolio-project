'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
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

/** A discreet tint, reusing the same token pairs `PersonTypeBadge` already uses — no new colors. */
export type MultiSelectTone = 'neutral' | 'primary' | 'signal' | 'success' | 'destructive';

const TONE_CLASSES: Record<MultiSelectTone, string> = {
  neutral: 'border-transparent bg-muted text-foreground',
  primary: 'border-primary/40 bg-primary-light text-primary',
  signal: 'border-signal/40 bg-signal-light text-signal-strong',
  success: 'border-toast-success/40 bg-toast-success-light text-toast-success',
  destructive: 'border-destructive/40 bg-destructive-light text-destructive',
};

export interface MultiSelectOption {
  value: string;
  label: string;
  /** Defaults to `'neutral'` — a soft category color for the selected tag, not the dropdown row. */
  tone?: MultiSelectTone;
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
  /**
   * Custom chip renderer for a selected option — falls back to a plain tinted
   * `Badge`. Receives the remove callback so a custom tag can merge its own
   * remove control the same way the default one does, rather than getting a
   * second, separately-drawn `X` button next to it.
   */
  renderTag?: (option: MultiSelectOption, onRemove: () => void) => React.ReactNode;
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
            selected.map((option) => {
              const handleRemove = () => remove(option.value);

              return (
                // `display: contents` — this span exists only to give the
                // mapped element a stable key; the tag itself becomes a
                // direct flex item of the trigger, same as if there were no
                // wrapper at all.
                <span key={option.value} className="contents">
                  {renderTag ? (
                    renderTag(option, handleRemove)
                  ) : (
                    <Badge
                      variant="outline"
                      className={cn('rounded-sm', TONE_CLASSES[option.tone ?? 'neutral'])}
                      removeLabel={`Remove ${option.label}`}
                      {...(disabled ? {} : { onRemove: handleRemove })}
                    >
                      {option.label}
                    </Badge>
                  )}
                </span>
              );
            })
          )}
          <ChevronDown
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
