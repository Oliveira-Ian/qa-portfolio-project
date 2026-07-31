'use client';

import * as React from 'react';
import { ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageInputProps {
  /** A file just picked, an already-uploaded URL, or nothing. */
  value: File | string | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  hint?: string;
  className?: string;
  'data-testid'?: string;
}

/**
 * `FileUpload` narrowed to a single image with a thumbnail preview — a
 * product photo or a person's avatar. Object URLs it creates for a picked
 * `File` are revoked on unmount/replacement so they don't leak.
 */
export function ImageInput({
  value,
  onChange,
  disabled = false,
  hint,
  className,
  ...props
}: ImageInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const previewUrl = React.useMemo(() => {
    if (!value) {
      return null;
    }

    return typeof value === 'string' ? value : URL.createObjectURL(value);
  }, [value]);

  React.useEffect(() => {
    if (previewUrl && typeof value !== 'string') {
      return () => URL.revokeObjectURL(previewUrl);
    }

    return undefined;
  }, [previewUrl, value]);

  function pickFile(fileList: FileList | null) {
    const file = fileList?.[0];

    if (file) {
      onChange(file);
    }
  }

  return (
    <div className={cn('flex items-start gap-4', className)} {...props}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          if (disabled) {
            return;
          }

          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          if (disabled) {
            return;
          }

          event.preventDefault();
          setIsDragging(false);
          pickFile(event.dataTransfer.files);
        }}
        className={cn(
          'relative flex size-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/30 outline-none transition-colors',
          'hover:border-border-hover focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40',
          isDragging && 'border-primary bg-primary/5',
          disabled && 'pointer-events-none cursor-not-allowed opacity-50',
        )}
      >
        {previewUrl ? (
          // A blob: URL or an arbitrary already-uploaded image, not a static
          // asset next/image's optimizer can process — a plain <img> is the
          // right tool here.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="size-full object-cover" />
        ) : (
          <ImageIcon className="size-6 text-muted-foreground" aria-hidden="true" />
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          disabled={disabled}
          className="sr-only"
          onChange={(event) => {
            pickFile(event.target.files);
            event.target.value = '';
          }}
        />
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <p className="text-sm text-foreground">
          <span className="font-medium text-primary">Click to upload</span> or drag and drop
        </p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        {previewUrl && !disabled ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => onChange(null)}
          >
            <X aria-hidden="true" />
            Remove
          </Button>
        ) : null}
      </div>
    </div>
  );
}
