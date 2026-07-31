'use client';

import * as React from 'react';
import { File as FileIcon, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  value: File[];
  onChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  /** Shown under the dropzone label, e.g. `"PNG or JPG, up to 5MB"`. */
  hint?: string;
  className?: string;
  'data-testid'?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * A drag-and-drop-or-click dropzone plus the file list it accumulates —
 * validation (type, size, count) is the caller's job, this only collects
 * `File`s and lets each be removed again. For a product image / OS
 * attachment field.
 */
export function FileUpload({
  value,
  onChange,
  accept,
  multiple = false,
  disabled = false,
  hint,
  className,
  ...props
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  function addFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      return;
    }

    const incoming = Array.from(fileList);
    onChange(multiple ? [...value, ...incoming] : incoming.slice(0, 1));
  }

  function removeFile(index: number) {
    onChange(value.filter((_, fileIndex) => fileIndex !== index));
  }

  return (
    <div className={cn('flex flex-col gap-3', className)} {...props}>
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
          addFiles(event.dataTransfer.files);
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-8 text-center transition-colors outline-none',
          'hover:border-border-hover focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40',
          isDragging && 'border-primary bg-primary/5',
          disabled && 'pointer-events-none cursor-not-allowed opacity-50',
        )}
      >
        <Upload className="size-5 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-foreground">
          <span className="font-medium text-primary">Click to upload</span> or drag and drop
        </p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="sr-only"
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = '';
          }}
        />
      </div>

      {value.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {value.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2"
            >
              <FileIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">{file.name}</span>
              <span className="tabular shrink-0 text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                disabled={disabled}
                aria-label={`Remove ${file.name}`}
                onClick={() => removeFile(index)}
              >
                <X aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
