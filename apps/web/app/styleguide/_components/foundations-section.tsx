import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StyleguideSection, ComponentDemo } from './section-shell';

interface Swatch {
  name: string;
  token: string;
  note: string;
}

function SwatchGrid({ swatches }: { swatches: Swatch[] }) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {swatches.map((swatch) => (
        <li key={swatch.name}>
          <div
            className={`h-14 rounded-md border border-border ${swatch.token}`}
            aria-hidden="true"
          />
          <p className="mt-2 text-sm font-medium text-foreground">{swatch.name}</p>
          <p className="text-xs text-text-3">{swatch.note}</p>
        </li>
      ))}
    </ul>
  );
}

/** Components read these semantic tokens, never a palette value (handoff § 2). */
const SURFACE_SWATCHES: Swatch[] = [
  { name: 'Background', token: 'bg-background', note: '--olv-bg · page ground' },
  { name: 'Surface', token: 'bg-surface', note: '--olv-surface · cards, tables, inputs' },
  { name: 'Surface 2', token: 'bg-surface-2', note: '--olv-surface-2 · table header, footers' },
  { name: 'Subtle', token: 'bg-subtle', note: '--olv-subtle · tags, neutral fills' },
];

const PRODUCT_SWATCHES: { name: string; product: 'platform' | 'erp' | 'fsm'; note: string }[] = [
  { name: 'Oliveira Platform', product: 'platform', note: 'Navy · gold on the dark shell' },
  { name: 'Oliveira ERP', product: 'erp', note: 'Olive · existing product' },
  { name: 'Oliveira FSM', product: 'fsm', note: 'Terracotta · placeholder' },
];

const TONE_SWATCHES: Swatch[] = [
  { name: 'Success', token: 'bg-success', note: 'Saved, active' },
  { name: 'Warning', token: 'bg-warning', note: 'Attention, a limit' },
  { name: 'Danger', token: 'bg-danger', note: 'Error, irreversible' },
  { name: 'Info', token: 'bg-info', note: 'Neutral notice' },
  { name: 'Success tint', token: 'bg-success-light', note: 'Alert, badge fill' },
  { name: 'Warning tint', token: 'bg-warning-light', note: 'Alert, badge fill' },
  { name: 'Danger tint', token: 'bg-danger-light', note: 'Alert, badge fill' },
  { name: 'Info tint', token: 'bg-info-light', note: 'Alert, badge fill' },
];

const BORDER_SWATCHES: Swatch[] = [
  { name: 'Border', token: 'bg-border', note: 'Cards, tables — decorative' },
  { name: 'Divider', token: 'bg-divider', note: 'Row rules' },
  { name: 'Button border', token: 'bg-border-button', note: 'Secondary buttons' },
  { name: 'Control border', token: 'bg-input', note: 'Inputs — at least 3:1 on white' },
  { name: 'Focus ring', token: 'bg-ring', note: 'Navy on light, gold on the shell' },
];

const SPACING_STEPS = [1, 2, 3, 4, 5, 6, 8, 10, 12].map((step) => ({
  name: `space-${step}`,
  px: step * 4,
  value: `var(--olv-space-${step})`,
}));

const RADIUS_STEPS = [
  { name: 'xs · 4', value: 'var(--olv-radius-xs)', use: 'Status badges' },
  { name: 'sm · 6', value: 'var(--olv-radius-sm)', use: 'Buttons, inputs, tabs' },
  { name: 'md · 10', value: 'var(--olv-radius-md)', use: 'Cards, tables, menus' },
  { name: 'lg · 12', value: 'var(--olv-radius-lg)', use: 'Product cards, modals' },
  { name: 'full', value: 'var(--olv-radius-full)', use: 'Tags, switches, avatars' },
];

const ELEVATION_STEPS = [
  { name: 'xs', value: 'var(--olv-elev-xs)', use: 'Secondary buttons, inputs' },
  { name: 'hover', value: 'var(--olv-elev-hover)', use: 'Clickable cards on hover' },
  { name: 'menu', value: 'var(--olv-elev-menu)', use: 'Menus, popovers, toasts' },
  { name: 'overlay', value: 'var(--olv-elev-overlay)', use: 'Drawers, modals' },
];

interface TypeRow {
  role: string;
  sample: React.ReactNode;
  spec: string;
  usage: string;
}

const TYPE_ROWS: TypeRow[] = [
  {
    role: 'Display',
    sample: <span className="olv-display text-foreground">Hello, Ana.</span>,
    spec: '38/42 · 600 · Archivo, width 118%',
    usage: 'Platform only: the auth panel headline and the Home greeting',
  },
  {
    role: 'Title L',
    sample: <span className="olv-title-l text-foreground">Sign in</span>,
    spec: '32/38 · 600 · Archivo',
    usage: 'Auth screen titles',
  },
  {
    role: 'H1 — page title',
    sample: (
      <span className="font-display text-[28px] leading-[34px] font-semibold text-foreground">
        People
      </span>
    ),
    spec: '28/34 · 600 · Archivo (24 on mobile)',
    usage: 'One per page — never more than one',
  },
  {
    role: 'H2 — section',
    sample: (
      <span className="font-display text-lg leading-6 font-semibold text-foreground">
        Latest entries
      </span>
    ),
    spec: '18/24 · 600 · Archivo',
    usage: 'A named subsection inside a page',
  },
  {
    role: 'H3 — card, dialog',
    sample: (
      <span className="font-display text-base leading-[22px] font-semibold text-foreground">
        Access account
      </span>
    ),
    spec: '16/22 · 600 · Archivo',
    usage: 'CardTitle, DialogTitle, drawer sections',
  },
  {
    role: 'Body',
    sample: <span className="text-sm text-foreground">Use your Oliveira account.</span>,
    spec: '14/21 · 400 · Archivo',
    usage: 'Default paragraph and description text (16/24 for a lead)',
  },
  {
    role: 'Label',
    sample: <span className="text-[13px] leading-[18px] font-medium text-foreground">Email</span>,
    spec: '13/18 · 500 · Archivo',
    usage: 'Every form field label and table header',
  },
  {
    role: 'Caption',
    sample: <span className="text-[12.5px] leading-[18px] text-text-3">Up to 500 characters</span>,
    spec: '12.5/18 · 400 · Archivo',
    usage: 'Help text and meta under a field',
  },
  {
    role: 'Overline',
    sample: <span className="olv-overline text-text-3">Records</span>,
    spec: '11/14 · 500 · JetBrains Mono, +0.12em, uppercase',
    usage: 'Sidebar groups, page meta lines, stat labels',
  },
  {
    role: 'Data',
    sample: <span className="olv-data tabular text-foreground">123.456.789-01</span>,
    spec: '13/18 · 400 · JetBrains Mono, tabular',
    usage: 'Codes, CPF/CNPJ, dates, counts, emails in lists',
  },
];

interface FieldRow {
  component: string;
  height: string;
  note: string;
}

const FIELD_ROWS: FieldRow[] = [
  {
    component: 'Input, NumberInput, CurrencyInput, MaskedInput, TimeInput',
    height: '40px (44 on auth and mobile)',
    note: 'Form field standard',
  },
  { component: 'Combobox', height: '40px', note: 'Form field standard' },
  { component: 'MultiSelect', height: '40px (min)', note: 'Grows with the selection' },
  { component: 'DatePicker, DateRangePicker', height: '40px', note: 'Button, default size' },
  { component: 'Button sm / md / lg', height: '32 / 36 / 44px', note: 'Large is the touch size' },
  { component: 'Select (small)', height: '36px', note: 'Toolbars, table cells, pagination' },
  { component: 'Table row', height: '48px (58 with avatar)', note: 'Header 40px' },
];

/**
 * Colors, type and the 4px grid — everything downstream reads from the Oliveira
 * tokens (`app/oliveira-tokens.css`, `docs/design/tokens.md`) rather than a
 * hardcoded value.
 */
export function FoundationsSection() {
  return (
    <StyleguideSection
      id="foundations"
      title="Foundations"
      description="The Oliveira Platform palette, type system and spacing scale every component below is built from."
    >
      <ComponentDemo id="foundations-colors" title="Colors">
        <div className="flex flex-col gap-8">
          <div>
            <p className="olv-overline text-text-3">Surfaces</p>
            <div className="mt-3">
              <SwatchGrid swatches={SURFACE_SWATCHES} />
            </div>
          </div>
          <div>
            <p className="olv-overline text-text-3">Product accent</p>
            <p className="mt-1 text-xs text-text-3">
              Set on a product&rsquo;s root with{' '}
              <code className="rounded-sm bg-subtle px-1.5 py-0.5 font-mono text-xs">
                data-product
              </code>
              . It is the only difference between the three products.
            </p>
            <ul className="mt-3 grid gap-4 sm:grid-cols-3">
              {PRODUCT_SWATCHES.map((swatch) => (
                <li
                  key={swatch.product}
                  data-product={swatch.product}
                  className="rounded-lg border border-border p-4"
                >
                  <p className="text-sm font-semibold text-foreground">{swatch.name}</p>
                  <p className="text-xs text-text-3">{swatch.note}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Button size="sm">Primary</Button>
                    <span className="size-6 rounded-full bg-accent-600" aria-hidden="true" />
                    <span className="size-6 rounded-full bg-accent-300" aria-hidden="true" />
                    <span className="size-6 rounded-full bg-accent-50" aria-hidden="true" />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-text-3">
              Carmine belongs to the logo only — it is never an error or a state colour.
            </p>
          </div>
          <div>
            <p className="olv-overline text-text-3">Tones</p>
            <div className="mt-3">
              <SwatchGrid swatches={TONE_SWATCHES} />
            </div>
          </div>
          <div>
            <p className="olv-overline text-text-3">Borders &amp; focus</p>
            <div className="mt-3">
              <SwatchGrid swatches={BORDER_SWATCHES} />
            </div>
          </div>
          <div>
            <p className="olv-overline text-text-3">Shell</p>
            <p className="mt-1 text-xs text-text-3">
              The global bar and sidebar are dark ink in every product; the product name takes the
              accent&rsquo;s 300 step.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-md bg-shell px-4 py-3 text-shell-text">
                <span className="olv-overline">Global bar</span>
                <span className="text-sm text-shell-text-muted">Muted text</span>
              </div>
              <div className="flex items-center gap-3 rounded-md bg-shell-2 px-4 py-3 text-shell-text">
                <span className="olv-overline text-accent-300">Sidebar</span>
                <span className="text-sm">Section label</span>
              </div>
            </div>
          </div>
        </div>
      </ComponentDemo>

      <ComponentDemo
        id="foundations-typography"
        title="Typography"
        description="Archivo (variable, weight 400–600, width 88–118) for everything; JetBrains Mono for codes, ids, dates and overlines. Sentence case; uppercase only through CSS."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Sample</TableHead>
              <TableHead>Size · weight · face</TableHead>
              <TableHead>Use it for</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {TYPE_ROWS.map((row) => (
              <TableRow key={row.role}>
                <TableCell className="font-medium text-foreground">{row.role}</TableCell>
                <TableCell>{row.sample}</TableCell>
                <TableCell className="text-text-3">{row.spec}</TableCell>
                <TableCell className="text-text-3">{row.usage}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ComponentDemo>

      <ComponentDemo
        id="foundations-field-sizing"
        title="Field sizing"
        description="40px is the standard height for a form field; auth screens and touch devices use 44px."
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-end gap-6">
            <div>
              <p className="mb-1.5 text-xs text-text-3">40px — form field</p>
              <Input
                className="w-44"
                placeholder="Input"
                data-testid="styleguide-field-sizing-input"
              />
            </div>
            <div>
              <p className="mb-1.5 text-xs text-text-3">44px — auth and touch</p>
              <Input className="h-11 w-44" placeholder="Input" />
            </div>
            <div>
              <p className="mb-1.5 text-xs text-text-3">36px — small select</p>
              <Select defaultValue="10">
                <SelectTrigger
                  size="sm"
                  className="w-44"
                  data-testid="styleguide-field-sizing-select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 rows</SelectItem>
                  <SelectItem value="25">25 rows</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Component</TableHead>
                <TableHead>Height</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FIELD_ROWS.map((row) => (
                <TableRow key={row.component}>
                  <TableCell className="font-medium text-foreground">{row.component}</TableCell>
                  <TableCell className="olv-data tabular text-text-3">{row.height}</TableCell>
                  <TableCell className="text-text-3">{row.note}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <p className="text-sm text-text-3">
            The small{' '}
            <code className="rounded-sm bg-subtle px-1.5 py-0.5 font-mono text-xs">Select</code> is
            for dense places — the pagination page-size picker, the Role editor in a Users table
            cell and the boolean column filter. For an actual form field use{' '}
            <a
              href="#form-controls-combobox"
              className="font-semibold text-foreground underline underline-offset-3"
            >
              Combobox
            </a>{' '}
            instead.
          </p>
        </div>
      </ComponentDemo>

      <ComponentDemo id="foundations-spacing-radius" title="Spacing, radius & elevation">
        <div className="flex flex-col gap-8">
          <div>
            <p className="olv-overline text-text-3">Spacing (4px base)</p>
            <ul className="mt-3 flex flex-col gap-2">
              {SPACING_STEPS.map((step) => (
                <li key={step.name} className="flex items-center gap-3">
                  <span className="olv-data w-20 shrink-0 text-text-3">{step.name}</span>
                  <span
                    className="h-3 rounded-xs bg-primary"
                    style={{ width: step.value }}
                    aria-hidden="true"
                  />
                  <span className="olv-data text-text-3">{step.px}px</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="olv-overline text-text-3">Radius</p>
            <div className="mt-3 flex flex-wrap gap-4">
              {RADIUS_STEPS.map((step) => (
                <div key={step.name} className="w-28 text-center">
                  <div
                    className="mx-auto size-14 border border-border bg-subtle"
                    style={{ borderRadius: step.value }}
                    aria-hidden="true"
                  />
                  <p className="olv-data mt-1.5 text-text-2">{step.name}</p>
                  <p className="text-xs text-text-3">{step.use}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="olv-overline text-text-3">Elevation</p>
            <div className="mt-3 flex flex-wrap gap-6">
              {ELEVATION_STEPS.map((step) => (
                <div key={step.name} className="w-32 text-center">
                  <div
                    className="mx-auto size-16 rounded-md bg-surface"
                    style={{ boxShadow: step.value }}
                    aria-hidden="true"
                  />
                  <p className="olv-data mt-2 text-text-2">{step.name}</p>
                  <p className="text-xs text-text-3">{step.use}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ComponentDemo>
    </StyleguideSection>
  );
}
