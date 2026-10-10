# Design — Typography

See [`/styleguide`](/styleguide)`#foundations-typography` for a live, rendered sample of every role
below. The scale is the Oliveira design system's (handoff § 3); this page records how it is built in
`apps/web`.

Two faces, each with one job — this is back-office software people read for hours, so the type system
is built for density and long sessions rather than a single hero moment.

## Faces

- **Archivo** — variable, weight 400–600, **width 88–118**. Everything: headings, labels, buttons, table
  cells. The width axis is what tells the display style apart.
- **JetBrains Mono** — 400–500. Anything a reader compares digit by digit or scans as a code: documents
  (CPF/CNPJ), phone numbers, ids, dates, counts, e-mail addresses in lists, overlines and status badges.
  Applied through `.olv-data` / `.tabular` (tabular numerals) and `.olv-overline`.

Weights are **400, 500, 600 only**; sentence case everywhere, uppercase only through CSS.

## Scale

| Role | Size / line | Weight | Classes | Use it for |
|---|---|---|---|---|
| Display | 38/42 (28/31 on mobile) | 600, width 118%, −0.02em | `.olv-display` | **Platform only**: the auth headline and the Home greeting |
| Title L | 32/38 (26/32 on mobile) | 600, −0.015em | `.olv-title-l` | Auth screen titles |
| H1 — page title | 28/34 (24 on mobile) | 600, −0.01em | `h1` (base layer) | One per page (`PageHeader`, `FormCardHeader`) |
| H2 — section | 18/24 | 600 | `h2` | A named subsection inside a page |
| H3 — card, dialog | 16/22 | 600 | `h3` | `CardTitle`, `DialogTitle`, drawer sections |
| Body L | 16/24 | 400 | `text-base` | A lead paragraph |
| Body | 14/21 | 400 | `text-sm` | Default paragraph and description text |
| Label | 13/18 | 500 | `text-[13px] font-medium` | Form field labels, table headers |
| Caption | 12.5/18 | 400 | `text-[12.5px]` | Help text and meta under a field |
| Overline | 11/14 | 500, mono, +0.12em, uppercase | `.olv-overline` | Sidebar groups, page meta lines, stat labels |
| Data | 13/18 | 400, mono, tabular | `.olv-data` | Codes, documents, dates, counts |

`width 88` (`.olv-condensed`) is allowed only on table headers, sidebar labels and badges, and only when
pt-BR would overflow them; reserve up to +35% in any label that has to fit (`docs/design/i18n.md`).

## Guidelines

- Hierarchy is title > labels > body; line height ~ 1.4–1.6 for running text.
- Headings use `text-wrap: balance` (set globally on `h1`–`h3` in `globals.css`).
- Numeric columns in tables and record sheets always use `.olv-data` + `.tabular`: proportional numerals
  misalign when scanned as a column.
- A **literal** `h1`/`h2`/`h3` picks up the display family from the base-layer rule in `globals.css`. An
  element playing the same role without being that tag (an `EmptyState` heading, a `<p>`) needs
  `font-display` added explicitly.
- Product and brand names ("Oliveira ERP") are proper nouns: `translate="no"` where they are written as
  text, never in a translation file.

## apps/web (Next.js)

Both families load through `next/font/google` in `apps/web/app/layout.tsx` — self-hosted by Next at build
time (no runtime request to Google; no layout shift while they load), exposed as `--font-archivo` and
`--font-jetbrains-mono` and mapped to `--olv-font-sans` / `--olv-font-mono` in `oliveira-tokens.css`.
`JetBrains_Mono` is loaded with only the two weights the data uses (400, 500) — every extra weight is
another font file on the critical path.

Check **real glyphs**, not a fallback: the handoff's screenshots were rendered with a fallback font. In a
browser, `document.fonts` should list `Archivo` and `JetBrains Mono` as loaded.
