'use client';

import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useT } from '@/lib/i18n/provider';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  testIdPrefix: string;
  className?: string;
}

/**
 * Controlled search field with a leading icon and a clear button that only
 * shows once there's something to clear. 36px in toolbars (handoff § 4).
 * Used by `ToolbarList`'s global search, but plain enough to embed anywhere a
 * search box is needed.
 */
export function SearchInput({
  value,
  onChange,
  placeholder,
  testIdPrefix,
  className,
}: SearchInputProps) {
  const t = useT();
  const label = placeholder ?? t('table.search.placeholder');

  return (
    <div className={cn('relative', className)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-3"
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={label}
        aria-label={label}
        data-testid={`${testIdPrefix}-toolbar-search`}
        className="h-9 pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => onChange('')}
          className="absolute top-1/2 right-1.5 -translate-y-1/2"
          aria-label={t('table.search.clear')}
          data-testid={`${testIdPrefix}-toolbar-search-clear`}
        >
          <X aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}
