import { Bold, Italic, Underline } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ComponentDemo, StyleguideSection } from './section-shell';

const VARIANTS = ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'] as const;
const SIZES = ['sm', 'default', 'lg'] as const;

export function ButtonsActionsSection() {
  return (
    <StyleguideSection
      id="buttons-actions"
      title="Buttons & actions"
      description="Sized a step larger than the shadcn preset — this is a back-office people spend hours in, and the stock control is below a comfortable pointer target."
    >
      <ComponentDemo
        id="buttons-actions-button"
        title="Button"
        description="Every variant, at every size."
      >
        <div className="flex flex-col gap-4">
          {SIZES.map((size) => (
            <div key={size} className="flex flex-wrap items-center gap-3">
              <span className="w-16 shrink-0 text-xs text-muted-foreground">{size}</span>
              {VARIANTS.map((variant) => (
                <Button key={variant} variant={variant} size={size}>
                  {variant === 'destructive' ? 'Delete' : 'Save'}
                </Button>
              ))}
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <span className="w-16 shrink-0 text-xs text-muted-foreground">disabled</span>
            <Button disabled>Save</Button>
            <Button variant="outline" disabled>
              Cancel
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <span className="w-16 shrink-0 text-xs text-muted-foreground">icon</span>
            <Button size="icon-sm" variant="ghost" aria-label="Bold">
              <Bold aria-hidden="true" />
            </Button>
            <Button size="icon" variant="outline" aria-label="Italic">
              <Italic aria-hidden="true" />
            </Button>
            <Button size="icon-lg" aria-label="Underline">
              <Underline aria-hidden="true" />
            </Button>
          </div>
        </div>
      </ComponentDemo>

      <ComponentDemo
        id="buttons-actions-toggle"
        title="Toggle"
        description="A single pressed/unpressed control — bold in a toolbar, not a multi-choice group."
      >
        <div className="flex gap-3">
          <Toggle aria-label="Toggle bold">
            <Bold aria-hidden="true" />
          </Toggle>
          <Toggle variant="outline" defaultPressed aria-label="Toggle italic (pressed)">
            <Italic aria-hidden="true" />
          </Toggle>
          <Toggle disabled aria-label="Toggle underline (disabled)">
            <Underline aria-hidden="true" />
          </Toggle>
        </div>
      </ComponentDemo>

      <ComponentDemo
        id="buttons-actions-toggle-group"
        title="Toggle group"
        description="Single or multiple selection among a fixed set — a density switch, a text-alignment picker. Sized like every other field (40px) rather than the smaller shadcn preset, with a tinted selected state (--accent, the same token reserved for &ldquo;selected&rdquo; elsewhere) so it doesn't read as just a slightly darker hover."
      >
        <div className="flex flex-col gap-5">
          <div>
            <p className="mb-1.5 text-xs text-muted-foreground">
              Single-select, <code className="font-mono">w-fit</code> (default)
            </p>
            <ToggleGroup type="single" defaultValue="center" variant="outline">
              <ToggleGroupItem value="left" aria-label="Align left">
                Left
              </ToggleGroupItem>
              <ToggleGroupItem value="center" aria-label="Align center">
                Center
              </ToggleGroupItem>
              <ToggleGroupItem value="right" aria-label="Align right">
                Right
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div>
            <p className="mb-1.5 text-xs text-muted-foreground">Multi-select, icon-only</p>
            <ToggleGroup type="multiple" defaultValue={['bold']}>
              <ToggleGroupItem value="bold" aria-label="Bold">
                <Bold aria-hidden="true" />
              </ToggleGroupItem>
              <ToggleGroupItem value="italic" aria-label="Italic">
                <Italic aria-hidden="true" />
              </ToggleGroupItem>
              <ToggleGroupItem value="underline" aria-label="Underline" disabled>
                <Underline aria-hidden="true" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div>
            <p className="mb-1.5 text-xs text-muted-foreground">
              Filling the available width —{' '}
              <code className="font-mono">className=&quot;w-full&quot;</code> with{' '}
              <code className="font-mono">flex-1</code> items
            </p>
            <ToggleGroup type="single" defaultValue="week" variant="outline" className="w-full">
              <ToggleGroupItem value="day" aria-label="Day" className="flex-1">
                Day
              </ToggleGroupItem>
              <ToggleGroupItem value="week" aria-label="Week" className="flex-1">
                Week
              </ToggleGroupItem>
              <ToggleGroupItem value="month" aria-label="Month" className="flex-1">
                Month
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </ComponentDemo>
    </StyleguideSection>
  );
}
