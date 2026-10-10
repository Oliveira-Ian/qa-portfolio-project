# Design — Tokens

Single source of truth for the design tokens (CSS variables) used in `apps/web`. For every swatch,
type style and radius rendered live against the real components, see
[`/styleguide`](/styleguide)`#foundations-colors`.

The tokens come from the Oliveira Platform design system (the Claude Design handoff, v1.1 —
`docs/oliveira-design-handoff.zip`), and the rule that governs them is the handoff's: **components
read semantic tokens, never palette values.** `apps/web/app/oliveira-tokens.css` is the handoff's token
file, unchanged except that the two font variables point at the families `next/font` self-hosts;
`apps/web/app/globals.css` maps those tokens onto Tailwind v4 and onto shadcn's slot names.

## Brand and product scopes

| | Platform | ERP | FSM |
|---|---|---|---|
| Accent (600, on light) | navy `#1E2C47` | olive `#4F6B3A` | terracotta `#A4502B` |
| Accent on the dark shell (300) | gold `#C8AE72` | `#A3BE85` | `#E39A70` |

"Oliveira" and the crest never change; only the product name and its accent do. The accent is set on a
product's root with `data-product="platform|erp|fsm"` (`AppShell` does it from the area being rendered)
and redefines `--olv-accent-{50,100,300,600,700,800}` plus the disabled tints — that is the **only**
per-product difference. Product-**access** UI (access badges, the access switches) always sits in the
Platform scope (`data-product="platform"`), so access can never be mistaken for a permission inside a
product.

Carmine `#7D2331` belongs to the logo only. It is never an error or a state colour.

## Semantic tokens (light — the only official theme)

```css
:root,
[data-theme='light'] {
  --olv-bg: #f4f2ed;          /* page ground */
  --olv-surface: #ffffff;     /* cards, tables, inputs */
  --olv-surface-2: #f8f7f3;   /* table header, read-only fields, footers */
  --olv-surface-hover: #faf9f6;
  --olv-border: #e4e0d8;      /* decorative: cards, tables */
  --olv-border-button: #d3cec4;
  --olv-border-control: #9a958b; /* inputs, checkboxes — at least 3:1 on white */
  --olv-text-2: #3b3f47;
  --olv-text-3: #5a5e67;      /* help and meta — 5.6:1 on the page ground */

  /* The shell: dark in every product */
  --olv-shell: #12151b;
  --olv-shell-2: #1a1e26;
  --olv-shell-border: #2a2f39;
  --olv-shell-text: #c9ccd3;
  --olv-shell-text-muted: #9ca0a8;
  --olv-shell-focus: var(--olv-gold-300);
}
```

Tones — `success`, `warning`, `danger`, `info`, `neutral` — each has a 50 (tint), 600 (solid), `on`
(text on the tint) and `border` step. They are the same four tones the Alert and the Toast use; there
are no product-coloured alerts or toasts.

The full list is in `oliveira-tokens.css`. Do not copy values from it into a component: if a component
needs a recurring colour, it needs a semantic token.

## Dark mode

Reserved, not designed and not enabled. The semantic layer is ready to be redefined under
`[data-theme='dark']` (the block is a commented placeholder in `globals.css`), there is no toggle, and
`next-themes` is not a dependency. Do not add a dark variant to a component — it would be designing the
theme one class at a time.

## Typography

Archivo (variable, weight 400–600, width 88–118) for everything; JetBrains Mono (400–500) for codes,
ids, documents, dates, counts and overlines. Both are self-hosted through `next/font/google` in
`app/layout.tsx` (`display: swap`), exposed as `--font-archivo` and `--font-jetbrains-mono`. See
`docs/design/typography.md` for the scale and rules.

## Spacing, sizing, radius, elevation, motion

- **Spacing**: a 4px base, `--olv-space-1 … --olv-space-12`. In components, Tailwind's own scale
  (`gap-6`, `px-8`) is what is used; the variables document the steps.
- **Sizing**: `--olv-control-{sm,md,lg}` 32/36/44, `--olv-input-h` 40 (44 on auth and below 768px),
  table rows 48 (58 with an avatar), header 40; global bar 52 (56 on mobile), sidebar 232, rail 64,
  drawer 480, modal 520.
- **Radius**: xs 4 (status badges), sm 6 (buttons, inputs, tabs), md 10 (cards, tables, menus), lg 12
  (product cards, modals), full (tags, switches, avatars).
- **Elevation**: `xs`, `hover` (clickable cards, with a 2px lift), `menu`, `overlay`; scrim at 48%.
- **Motion**: 120ms for colour and border, 160ms for a card lift, a switch knob, a tab indicator; the
  toast enters in 200ms and leaves in 160ms. `prefers-reduced-motion` is respected.

## Tailwind mapping (apps/web)

`globals.css` re-expresses the tokens for Tailwind v4 (`@theme inline`):

- shadcn's slots (`bg-background`, `bg-primary`, `text-muted-foreground`, `border-border`, the
  `sidebar-*` family) are **aliases** of `--olv-*` tokens, so shadcn components work unmodified. The
  slots that depend on the accent (`--primary`, `--ring`, …) are redeclared in
  `:root, [data-product]`, which is what makes them follow the product scope instead of resolving once
  at `:root`.
- Project utilities: `bg-surface`, `bg-surface-2`, `bg-subtle`, `text-text-2`/`text-text-3`, the tone
  families (`bg-success-light`, `text-danger-on`, …), `bg-shell*`, `bg-accent-{50,100,300,600}`.
- `ring-focus` and `ring-focus-shell`: the focus treatment (a 2px gap in the surface colour and a 2px
  ring — navy on light, gold on the shell). Focus is always `focus-visible`, never `focus`.
- Type helpers: `.olv-display` (Platform only: the auth headline and the Home greeting),
  `.olv-title-l`, `.olv-overline` (mono, 11px, uppercase, +0.12em), `.olv-data` (mono 13px),
  `.tabular`, `.olv-condensed` (width 88, only when pt-BR overflows a header or a badge).

### Pitfall: don't put named sizes in `--spacing-*`

Tailwind v4 resolves **named** `max-w-*`, `w-*`, `h-*` sizes through the same `--spacing-{name}`
namespace used for padding, margin and gap. Defining `--spacing-md: 16px` inside `@theme` silently turns
`max-w-md` into `16px` — no error, just a broken layout. The spacing variables are `--olv-space-N`
(numeric) for that reason.

## Rules

- Always reuse tokens; avoid hardcoding values.
- Text colour is checked against WCAG AA independently of how a colour reads as a fill: gold is never
  text on white; `--olv-text-3` is the lightest text the system uses.
- Never carry meaning by colour alone: a status, an access state, a role or an error always has text or
  an icon too.
- The three small marks never stand in for each other: a **tag** (a category — Archivo, sentence case, a
  pill: role Admin/Member, a person's type), a **status badge** (a state — mono, uppercase, a dot) and
  an **access badge** (the Platform's answer to "can this member open the product").
