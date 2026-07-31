'use client';

import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
 * shows once there's something to clear. Used by `ToolbarList`'s global
 * search, but plain enough to embed anywhere a search box is needed.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  testIdPrefix,
  className,
}: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        data-testid={`${testIdPrefix}-toolbar-search`}
        className="pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => onChange('')}
          className="absolute top-1/2 right-1.5 -translate-y-1/2"
          aria-label="Clear search"
          data-testid={`${testIdPrefix}-toolbar-search-clear`}
        >
          <X aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}
