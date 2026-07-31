# Design — Typography

Three faces, each with one job — this is a piece of back-office software people read for hours, not a marketing page, so the type system is built for density and long sessions rather than a single hero moment.

## Faces

- **Display** — `Archivo`. Headings, eyebrows, page titles. A grotesque with the flat, wide bones of site signage; used with restraint (headings only, never body copy).
- **Body / UI** — `Inter`. Every interface string: labels, buttons, descriptions, table cells.
- **Data** — `IBM Plex Mono`. Anything a reader compares digit by digit: documents (CPF/CNPJ), phone numbers, ids, dates in tables. Applied via the `.tabular` utility class, which also sets `font-variant-numeric: tabular-nums`.

## Guidelines

- Consistent hierarchy (title > labels > body)
- Readability: line-height ~ 1.4–1.6 for text
- Headings use `text-wrap: balance` (set globally on `h1`–`h3` in `globals.css`) so a heading never ends with a single orphaned word.
- Numeric columns in tables and record sheets always use `.tabular` — plain proportional numerals misalign when scanned as a column.

## apps/web (Next.js)

All three faces load via `next/font/google` in `apps/web/app/layout.tsx` — self-hosted by Next at build time (no runtime request to Google, no layout shift while the font loads). Exposed as CSS variables (`--font-display`, `--font-sans`, `--font-mono`) mapped to Tailwind utilities `font-display` / `font-sans` / `font-mono`. `IBM_Plex_Mono` is loaded with only the two weights the data columns actually use (400, 500) — every extra weight is another font file on the critical path for no visual gain.

## Eyebrows

Small, wide, upper-case labels (`.eyebrow` in `globals.css`) sit above section titles and field-group legends — the register of a stamped drawing label (`REGISTRY`, `IDENTIFICATION`, `SETTINGS`). They name what follows; they are never decorative filler.
