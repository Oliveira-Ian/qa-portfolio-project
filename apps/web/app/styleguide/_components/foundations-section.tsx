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
          <p className="text-xs text-muted-foreground">{swatch.note}</p>
        </li>
      ))}
    </ul>
  );
}

const SURFACE_SWATCHES: Swatch[] = [
  { name: 'Background', token: 'bg-background', note: 'Page ground' },
  { name: 'Card', token: 'bg-card border', note: 'Surfaces, panels' },
  { name: 'Popover', token: 'bg-popover', note: 'Floating content' },
  { name: 'Muted', token: 'bg-muted', note: 'Subtle fills, disabled' },
];

const BRAND_SWATCHES: Swatch[] = [
  { name: 'Primary', token: 'bg-primary', note: 'Primary action' },
  { name: 'Primary hover', token: 'bg-primary-hover', note: 'Primary, hovered' },
  { name: 'Secondary', token: 'bg-secondary', note: 'Secondary surfaces' },
  { name: 'Accent', token: 'bg-accent', note: 'Selected / active state' },
];

const FEEDBACK_SWATCHES: Swatch[] = [
  { name: 'Signal', token: 'bg-signal', note: 'Fills, marks — not text' },
  { name: 'Signal strong', token: 'bg-signal-strong', note: 'Text-safe signal (AA)' },
  { name: 'Destructive', token: 'bg-destructive', note: 'Delete, irreversible' },
  { name: 'Toast success', token: 'bg-toast-success', note: '' },
  { name: 'Toast error', token: 'bg-toast-error', note: '' },
  { name: 'Toast warning', token: 'bg-toast-warning', note: '' },
  { name: 'Toast info', token: 'bg-toast-info', note: '' },
];

/** Soft tint of each feedback color — for a badge/pill fill, not a solid block. */
const FEEDBACK_LIGHT_SWATCHES: Swatch[] = [
  { name: 'Destructive light', token: 'bg-destructive-light', note: 'Destructive, as a fill' },
  { name: 'Toast success light', token: 'bg-toast-success-light', note: '' },
  { name: 'Toast error light', token: 'bg-toast-error-light', note: '' },
  { name: 'Toast warning light', token: 'bg-toast-warning-light', note: '' },
  { name: 'Toast info light', token: 'bg-toast-info-light', note: '' },
];

const BORDER_SWATCHES: Swatch[] = [
  { name: 'Border', token: 'bg-border', note: 'Default border/divider' },
  { name: 'Border hover', token: 'bg-border-hover', note: 'Hovered control border' },
  { name: 'Ring', token: 'bg-ring', note: 'Focus ring' },
];

const SPACING_STEPS = [
  { name: 'xs', value: 'var(--spacing-xs)' },
  { name: 'sm', value: 'var(--spacing-sm)' },
  { name: 'md', value: 'var(--spacing-md)' },
  { name: 'lg', value: 'var(--spacing-lg)' },
  { name: 'xl', value: 'var(--spacing-xl)' },
  { name: '2xl', value: 'var(--spacing-2xl)' },
];

const RADIUS_STEPS = [
  { name: 'sm', className: 'rounded-sm' },
  { name: 'md', className: 'rounded-md' },
  { name: 'lg', className: 'rounded-lg' },
  { name: 'xl', className: 'rounded-xl' },
];

interface TypeRow {
  role: string;
  sample: React.ReactNode;
  spec: string;
  usage: string;
}

const TYPE_ROWS: TypeRow[] = [
  {
    role: 'Eyebrow',
    sample: <span className="eyebrow text-primary">Registry</span>,
    spec: '11px · Semibold · Archivo',
    usage: 'Label above a page title or a field-group legend',
  },
  {
    role: 'H1 — page title',
    sample: (
      <span className="font-display text-2xl font-semibold tracking-tight text-foreground">
        People
      </span>
    ),
    spec: '24px → 28px (sm) · Semibold · Archivo',
    usage: 'One per page or per form — never more than one',
  },
  {
    role: 'H2 — section heading',
    sample: (
      <span className="font-display text-lg font-semibold text-foreground">Latest entries</span>
    ),
    spec: '18px · Semibold · Archivo',
    usage: 'A named subsection inside a page',
  },
  {
    role: 'H3 — card / dialog title',
    sample: <span className="text-base font-medium text-foreground">Access account</span>,
    spec: '16px · Medium · Inter',
    usage: 'Contextual, secondary — CardTitle, DialogTitle',
  },
  {
    role: 'Body',
    sample: <span className="text-sm text-foreground">Pick up where the site left off.</span>,
    spec: '14px · Regular · Inter',
    usage: 'Default paragraph and description text',
  },
  {
    role: 'Label',
    sample: <span className="text-sm leading-none font-medium text-foreground">Email</span>,
    spec: '14px · Medium · Inter',
    usage: 'Every form field label',
  },
  {
    role: 'Placeholder',
    sample: <span className="text-sm text-text-muted">you@example.com</span>,
    spec: '14px · Regular · Inter, muted',
    usage: 'Input placeholder — never a substitute for a Label',
  },
  {
    role: 'Table header',
    sample: <span className="text-sm font-medium text-foreground">Name</span>,
    spec: '14px · Medium · Inter',
    usage: 'Column headers',
  },
  {
    role: 'Table cell',
    sample: <span className="text-sm text-foreground">Construtora Vale Verde</span>,
    spec: '14px · Regular · Inter',
    usage: 'Row data',
  },
  {
    role: 'Badge',
    sample: <span className="text-xs font-medium text-foreground">ACTIVE</span>,
    spec: '12px · Medium · Inter',
    usage: 'Status/type marks',
  },
  {
    role: 'Caption / helper (proposed)',
    sample: <span className="text-xs text-muted-foreground">Up to 500 characters</span>,
    spec: '12px · Regular · Inter, muted',
    usage: 'A hint or count under a field — no current usage yet',
  },
  {
    role: 'Tabular data',
    sample: <span className="tabular text-sm text-foreground">123.456.789-01</span>,
    spec: 'Plex Mono · tabular-nums',
    usage: 'CPF/CNPJ, phone, ids, dates read as a column',
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
    height: '40px',
    note: 'Form field standard',
  },
  { component: 'Combobox', height: '40px', note: 'Form field standard' },
  { component: 'MultiSelect', height: '40px (min)', note: 'Grows with the selection' },
  { component: 'DatePicker, DateRangePicker', height: '40px', note: 'Button, default size' },
  { component: 'Select', height: '32px', note: 'Compact/dense contexts only — see below' },
];

/**
 * Colors, type and the 8px grid — everything downstream reads from these
 * tokens (`docs/design/tokens.md`) rather than a hardcoded value.
 */
export function FoundationsSection() {
  return (
    <StyleguideSection
      id="foundations"
      title="Foundations"
      description="The Olival palette, type system and spacing scale every component below is built from."
    >
      <ComponentDemo id="foundations-colors" title="Colors">
        <div className="flex flex-col gap-8">
          <div>
            <p className="eyebrow text-muted-foreground">Surfaces</p>
            <div className="mt-3">
              <SwatchGrid swatches={SURFACE_SWATCHES} />
            </div>
          </div>
          <div>
            <p className="eyebrow text-muted-foreground">Brand</p>
            <div className="mt-3">
              <SwatchGrid swatches={BRAND_SWATCHES} />
            </div>
          </div>
          <div>
            <p className="eyebrow text-muted-foreground">Feedback</p>
            <div className="mt-3">
              <SwatchGrid swatches={FEEDBACK_SWATCHES} />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Tints — the same colors at low opacity, for a badge or pill fill.
            </p>
            <div className="mt-3">
              <SwatchGrid swatches={FEEDBACK_LIGHT_SWATCHES} />
            </div>
          </div>
          <div>
            <p className="eyebrow text-muted-foreground">Borders &amp; focus</p>
            <div className="mt-3">
              <SwatchGrid swatches={BORDER_SWATCHES} />
            </div>
          </div>
          <div>
            <p className="eyebrow text-muted-foreground">Chrome</p>
            <p className="mt-1 text-xs text-muted-foreground">
              The header and sidebar are deliberately dark ink in both themes — not a literal
              inversion of the page.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-md bg-header px-4 py-3 text-header-foreground">
                <span className="eyebrow">Header</span>
                <span className="text-header-foreground-muted text-sm">Muted text</span>
              </div>
              <div className="flex items-center gap-3 rounded-md bg-sidebar px-4 py-3 text-sidebar-foreground">
                <span className="eyebrow text-sidebar-accent-foreground">Sidebar</span>
                <span className="text-sm">Section label</span>
              </div>
            </div>
          </div>
        </div>
      </ComponentDemo>

      <ComponentDemo
        id="foundations-typography"
        title="Typography"
        description="Every role the app uses, or has a documented spot for — see docs/design/typography.md for the full writeup."
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
                <TableCell className="text-muted-foreground">{row.spec}</TableCell>
                <TableCell className="text-muted-foreground">{row.usage}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ComponentDemo>

      <ComponentDemo
        id="foundations-field-sizing"
        title="Field sizing"
        description="h-10 (40px) is the standard height for a form field — sized for a comfortable pointer target on a screen used for hours, not the smaller 32px shadcn preset."
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-end gap-6">
            <div>
              <p className="mb-1.5 text-xs text-muted-foreground">40px — form field</p>
              <Input
                className="w-44"
                placeholder="Input"
                data-testid="styleguide-field-sizing-input"
              />
            </div>
            <div>
              <p className="mb-1.5 text-xs text-muted-foreground">32px — compact/dense only</p>
              <Select defaultValue="10">
                <SelectTrigger className="w-44" data-testid="styleguide-field-sizing-select">
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
                  <TableCell className="tabular text-muted-foreground">{row.height}</TableCell>
                  <TableCell className="text-muted-foreground">{row.note}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <p className="text-sm text-muted-foreground">
            <code className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs">Select</code>{' '}
            stays at 32px on purpose in the three places it&rsquo;s actually used today — the
            pagination page-size picker, the Role editor in a Users table cell, and the boolean
            column filter — all compact controls embedded in dense UI. For an actual form field, use{' '}
            <a
              href="#form-controls-combobox"
              className="text-primary underline-offset-4 hover:underline"
            >
              Combobox
            </a>{' '}
            instead.
          </p>
        </div>
      </ComponentDemo>

      <ComponentDemo id="foundations-spacing-radius" title="Spacing & radius">
        <div className="flex flex-col gap-8">
          <div>
            <p className="eyebrow text-muted-foreground">Spacing (8px grid)</p>
            <ul className="mt-3 flex flex-col gap-2">
              {SPACING_STEPS.map((step) => (
                <li key={step.name} className="flex items-center gap-3">
                  <span className="w-8 shrink-0 text-xs text-muted-foreground">{step.name}</span>
                  <span
                    className="h-3 rounded-xs bg-primary"
                    style={{ width: step.value }}
                    aria-hidden="true"
                  />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow text-muted-foreground">Radius</p>
            <div className="mt-3 flex flex-wrap gap-4">
              {RADIUS_STEPS.map((step) => (
                <div key={step.name} className="text-center">
                  <div
                    className={`size-14 border border-border bg-muted ${step.className}`}
                    aria-hidden="true"
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">{step.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ComponentDemo>
    </StyleguideSection>
  );
}
