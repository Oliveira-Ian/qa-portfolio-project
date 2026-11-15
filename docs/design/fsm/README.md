# Design — Oliveira FSM (Design System V2)

**Status: approved and implemented (2026-11-15, PRs #88–#92).** This folder is the reference the
Oliveira FSM frontend (`apps/web/app/fsm/**`) is built from; a change to the FSM's look starts here and
in the canvas.

The Oliveira FSM has its own design system, **on top of** the shared Foundation. Everything else in
`docs/design/` (tokens, typography, buttons, forms, layouts, listing pages) is **Foundation Design
System V1** and keeps governing the **Oliveira Platform**, the **Oliveira ERP** and everything shared
(brand, global bar, Toast, Alert, i18n and accessibility rules). V2 changes nothing for them.

## Files

| File | What it is |
|---|---|
| [`HANDOFF-FSM.md`](HANDOFF-FSM.md) | The spec: precedence, product separation, boards → routes, tokens, type, components and states, layouts, responsive rules, behaviour to keep, accessibility, the new fields, the pt-BR glossary, pending decisions |
| [`oliveira-fsm-tokens.css`](oliveira-fsm-tokens.css) | The tokens, every rule scoped to `[data-product="fsm"]` |
| [`oliveira-fsm-components.css`](oliveira-fsm-components.css) | The approved boards' CSS, de-duplicated — a reference to rebuild with Tailwind + shadcn, not production CSS |
| [`../../oliveira-fsm-design-handoff.zip`](../../oliveira-fsm-design-handoff.zip) | Snapshot: the three files, the 30 board sources (`canvas-source/`), PNG captures (`screens/`) and the script that generated the boards (`generator/`) |

The source of truth is the Claude Design canvas "Oliveira — Design System" (rows titled *Oliveira FSM ·
Design System v2*, boards F01, FSM-00 … FSM-10, M06–M08; the three files live there under
`project/handoff/fsm/`). These copies are a snapshot of canvas **version 42**. When the canvas changes,
copy the files again and regenerate the zip in the same commit, so the two never disagree.

## Precedence

1. Inside `/fsm`, **FSM V2 wins** over Foundation V1 for every visual and UX decision in the content area.
2. The Platform and the ERP stay on **V1**. Nothing in V2 may be loaded or applied outside
   `[data-product="fsm"]`.
3. Business rules (the FSM spec `docs/especificacoes/fsm-v1.md`, `packages/schemas/src/fsm/*`, the API)
   beat the boards; a board that disagrees adapts.
4. FSM-specific statements in V1 docs and V1 boards (the FSM placeholder S17, "Primary · FSM", the FSM
   accent tints) are superseded by V2.

## How V2 maps onto apps/web

- **Tokens.** `oliveira-fsm-tokens.css` is copied to `apps/web/app/` and imported **after**
  `oliveira-tokens.css`. Section A redefines the V1 semantic tokens (`--olv-bg`, `--olv-surface*`,
  `--olv-border*`, `--olv-text*`, `--olv-accent-*`, `--olv-focus`, `--olv-sidebar-w`) inside
  `[data-product="fsm"]`; because `globals.css` maps shadcn's slots onto `--olv-*`, shared primitives
  pick up the FSM look under `/fsm` without a fork. Section B adds `--fsm-*` tokens, exposed to
  Tailwind in `globals.css` (`@theme inline`) as FSM-only utilities. `AppShell` already sets
  `data-product="fsm"` on the FSM area.
- **Shared components get opt-in variants, never new defaults.** E.g. `Button` gains a `confirm`
  variant; `Tabs` a `fill` option; `RecordForm`/`useEntityForm` a read-only presentation for view
  mode. Their current defaults must render the Platform and the ERP exactly as today.
- **FSM-only pieces live in `components/fsm/`**: status pill, priority, criticality, due signal,
  person, record header + facts, lifecycle progress, work-order stepper and summary, technician
  picker, KPI tile, dispatch timeline, mobile work-order card.
- **Forms** keep React Hook Form + zod + shadcn (`.claude/rules/rules-global.md`); the stepper
  validates one zod schema per step and the whole schema on create/save.
- **Text** goes through `apps/web/lib/i18n/messages/fsm.ts` (EN + pt-BR), reusing existing keys first —
  the glossary is in `HANDOFF-FSM.md` § 10.

## What differs from Foundation V1 (summary)

| | Foundation V1 (Platform, ERP) | FSM V2 |
|---|---|---|
| Page ground / ink / borders | beige `#F4F2ED`, warm greys | slate `#F2F4F7`, `#111827`, `#E3E6EB` |
| Accent use | primary buttons, nav, tabs, selection | terracotta (same hue) **only** for selection, current step, focus, links |
| Confirm button | accent fill (ERP: `create` outline green) | mint `#44C38A` with dark text `#053D27` |
| Status | mono uppercase badge | pill with a dot, one hue per work-order status |
| View mode | disabled-looking input | value on a hairline, full contrast, "—" when empty |
| Records | one page, stacked sections | equal-width tabs (Overview, Details, Sites…) |
| Work order create / edit | — | four steps, the same for creating and editing |
| Type scale | V1 (h1 28/34, mono overline) | FSM scale (page 24/32, record 22/28, card 15/22, Archivo overline) |

## Where it lives in apps/web

| Piece | File |
|---|---|
| Tokens | `app/oliveira-fsm-tokens.css`, the FSM block and the view-mode block of `app/globals.css` |
| Marks (status pill, priority, overdue, criticality) | `components/fsm/status-pill.tsx`, `components/fsm/work-order-badges.tsx` |
| Record layout (header, facts, equal-width tabs, card, section card, read-only field, callout, hint) | `components/fsm/record-layout.tsx` |
| Person (avatar + name) | `components/fsm/person-chip.tsx` |
| Dates, durations, due signal (business time zone) | `lib/fsm-format.ts` |
| Work orders — record, list, steps | `app/fsm/operations/work-orders/work-orders/_components/` |
| Customer, equipment | `app/fsm/records/customers/{customers,equipment}/_components/` |
| Operations overview | `app/fsm/_components/operations-overview.tsx` |
| Messages | `lib/i18n/messages/fsm-ui.ts` (`fsmUi.*`, EN + pt-BR) |
| Confirm button | `components/ui/button.tsx`, variant `confirm` (FSM only) |

Not redesigned beyond the tokens and the read-only view: the catalog, branch and access forms (they use
the shared `RecordForm`, already narrow); phones (decision D4).

## Pending

- **Decided — D1:** the F01 sidebar is the shell standard of **every** product (Platform, ERP, FSM), each
  with its own modules, icons and accent. It is a Foundation change: `docs/design/layouts/dashboard.md`.
- **Decided — D4:** no phone layouts in the web app for now (desktop and tablet only); M06–M08 stay as
  reference for a future mobile app.
- **D3 — 1024 and 768 px** are specified in `HANDOFF-FSM.md` § 6, not drawn; check them in the browser.
