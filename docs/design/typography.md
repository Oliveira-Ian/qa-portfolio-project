# Design — Typography

See [`/styleguide`](/styleguide)`#foundations-typography` for a live, rendered sample of every role
below, against the current theme.

Three faces, each with one job — this is a piece of back-office software people read for hours, not a marketing page, so the type system is built for density and long sessions rather than a single hero moment.

## Faces

- **Display** — `Archivo`. Headings, eyebrows, page titles. A grotesque with the flat, wide bones of site signage; used with restraint (headings only, never body copy).
- **Body / UI** — `Inter`. Every interface string: labels, buttons, descriptions, table cells.
- **Data** — `IBM Plex Mono`. Anything a reader compares digit by digit: documents (CPF/CNPJ), phone numbers, ids, dates in tables. Applied via the `.tabular` utility class, which also sets `font-variant-numeric: tabular-nums`.

## Scale

Every role in the app, as it's actually implemented today — grounded in the real components, not a
scale invented separately from them. Where a role didn't exist yet, it's marked **(proposed)**: a
documented convention to reach for going forward, not a retroactive change to something already
shipped.

| Role | Size | Weight | Face | Classes (`apps/web`) | Use it for |
|---|---|---|---|---|---|
| Eyebrow | 11px (`0.6875rem`) | Semibold (600) | Archivo | `.eyebrow` (uppercase, `0.14em` tracking) | The drawing-label above a page title or a field-group legend — `REGISTRY`, `IDENTIFICATION` |
| H1 — page title | 24px → 28px (`sm:`) | Semibold (600) | Archivo | `text-2xl font-semibold tracking-tight sm:text-[1.75rem]` | One per page (`PageHeader`) or per form (`FormCardHeader`) — never more than one |
| H2 — section heading | 18px | Semibold (600) | Archivo | `text-lg font-semibold` | A named subsection inside a page — `/home`'s "Latest entries", "By type" |
| H3 — card / dialog title | 16px | Medium (500) | Inter | `text-base font-medium` | `CardTitle`, `DialogTitle` — contextual and secondary, so body-weight rather than a full display heading |
| Subtitle | 14px | Regular (400) | Inter, muted | same as Body | Sits directly under a heading — a positional role, not a distinct style |
| Body | 14px | Regular (400) | Inter | `text-sm text-foreground` | Default paragraph/description text |
| Label | 14px | Medium (500) | Inter | `text-sm font-medium leading-none` | Every form field's `Label` |
| Placeholder | 14px (inherited) | Regular (400) | Inter, `text-text-muted` | `placeholder:text-text-muted` | Input placeholder text — never a substitute for a real `Label` |
| Table header | 14px (inherited) | Medium (500) | Inter | `TableHead` | Column headers |
| Table cell | 14px (inherited) | Regular (400) | Inter | `TableCell` | Row data |
| Button text | 14px (`default`/`lg`) · 13px (`sm`) · 12px (`xs`) | Medium (500) | Inter | see `button.tsx` | `sm`'s `text-[0.8125rem]` is an arbitrary in-between value, not a scale step — documented as-is, not rounded off |
| Badge | 12px | Medium (500) | Inter | `text-xs font-medium` | Status/type marks (`PersonTypeBadge`, `PersonStatusBadge`) |
| Caption / helper text **(proposed)** | 12px | Regular (400) | Inter, muted | `text-xs text-muted-foreground` | A hint or character count under a field — no current usage to point to yet, but this is the size to reach for |
| Messages (toast / alert) | 14px (title: medium) | Regular body, Medium title | Inter | follows Body/Label — Sonner has no font override of its own | Toasts, `AlertTitle`/`AlertDescription` |
| Footer **(proposed)** | 12px | Regular (400) | Inter, muted | `text-xs text-muted-foreground` | No footer exists in the app yet — this is the spec to use if one is added |
| Tabular data | — | Regular/Medium | Plex Mono | `.tabular` (`font-variant-numeric: tabular-nums`) | CPF/CNPJ, phone numbers, ids, dates read as a column |

### Weights

Four named steps, used deliberately rather than reached for by default:

- **Regular (400)** — the default for body copy, table cells, descriptions. Most of the interface's text sits here.
- **Medium (500)** — labels, table headers, button text, card/dialog titles, badges. The "this is interactive or structural, not prose" weight.
- **Semibold (600)** — headings (H1/H2) and eyebrows only. Reserved for the handful of elements that establish hierarchy on a page.
- **Bold (700)** — not used anywhere in the app today. Reserved for a rare, pointed emphasis (a critical total, a hard warning) — introduce it deliberately when that case actually arrives, not as a stronger label weight (that's what Semibold is for).

## Guidelines

- Consistent hierarchy (title > labels > body)
- Readability: line-height ~ 1.4–1.6 for text
- Headings use `text-wrap: balance` (set globally on `h1`–`h3` in `globals.css`) so a heading never ends with a single orphaned word.
- Numeric columns in tables and record sheets always use `.tabular` — plain proportional numerals misalign when scanned as a column.
- A **literal** `h1`/`h2`/`h3` element picks up `font-family: var(--font-display)` automatically from the base-layer rule in `globals.css`. An element playing the same visual role without being that literal tag (e.g. `EmptyState`'s heading, which is a `<p>`) needs `font-display` added explicitly — it won't inherit it for free.

## apps/web (Next.js)

All three faces load via `next/font/google` in `apps/web/app/layout.tsx` — self-hosted by Next at build time (no runtime request to Google, no layout shift while the font loads). Exposed as CSS variables (`--font-display`, `--font-sans`, `--font-mono`) mapped to Tailwind utilities `font-display` / `font-sans` / `font-mono`. `IBM_Plex_Mono` is loaded with only the two weights the data columns actually use (400, 500) — every extra weight is another font file on the critical path for no visual gain.

## Eyebrows

Small, wide, upper-case labels (`.eyebrow` in `globals.css`) sit above section titles and field-group legends — the register of a stamped drawing label (`REGISTRY`, `IDENTIFICATION`, `SETTINGS`). They name what follows; they are never decorative filler.
