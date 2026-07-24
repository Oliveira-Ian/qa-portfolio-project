# Design — Tokens

Single source of truth for the tokens (CSS variables) used in this project.

## CSS Variables

```css
:root {
  /* Colors */
  --bg-page: #F5F7FA;
  --bg-card: #FFFFFF;
  --bg-input: #FFFFFF;

  --primary: #2563EB;
  --primary-hover: #1D4ED8;
  --primary-light: rgba(37, 99, 235, 0.1);

  --text-primary: #111827;
  --text-secondary: #6B7280;
  --text-muted: #9CA3AF;

  --border: #D1D5DB;
  --border-focus: #2563EB;
  --border-hover: #9CA3AF;

  --error: #EF4444;
  --shadow-color: rgba(0, 0, 0, 0.08);

  /* Typography */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

  /* Spacing (8px grid) */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 12px;

  /* Shadows */
  --shadow-card: 0 4px 20px var(--shadow-color);
  --shadow-input: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-button: 0 4px 12px rgba(37, 99, 235, 0.25);
}
```

## Rules

- Always reuse tokens; avoid hardcoding values.
- When you need a recurring new value (e.g. overlay/banner), create a semantic token.

## Tailwind mapping (apps/web)

Same values, re-expressed in `apps/web/app/globals.css` for Tailwind v4 (`@theme inline`), using shadcn/ui's standard slot names where one exists so shadcn components work unmodified. No dark theme — the design system is light-only, so there is no `.dark` block.

| Old token (`tokens.css`, legacy `frontend/`) | New key (`globals.css`, `apps/web`) | Tailwind utility |
|---|---|---|
| `--bg-page` | `--background` | `bg-background` |
| `--bg-card` | `--card` | `bg-card` |
| `--bg-input` | `--input-background` | `bg-input-background` |
| `--primary` | `--primary` | `bg-primary` / `text-primary` / `border-primary` |
| `--primary-hover` | `--primary-hover` | `bg-primary-hover` |
| `--primary-light` | `--primary-light` | `bg-primary-light` |
| *(implied by legacy button text color)* | `--primary-foreground` | `text-primary-foreground` |
| `--text-primary` | `--foreground` | `text-foreground` |
| `--text-secondary` | `--muted-foreground` | `text-muted-foreground` |
| `--text-muted` | `--text-muted` | `text-text-muted` |
| `--border` | `--border` | `border-border` |
| `--border-focus` | `--border-focus` / `--ring` | `border-border-focus`, `ring-ring` |
| `--border-hover` | `--border-hover` | `border-border-hover` |
| `--error` | `--destructive` | `bg-destructive` / `text-destructive` |
| `--radius-sm/md/lg` | `--radius-sm/md/lg` | `rounded-sm` / `rounded-md` / `rounded-lg` |
| `--shadow-card` / `-input` / `-button` / `-button-hover` | same names | `shadow-card`, `shadow-input`, `shadow-button`, `shadow-button-hover` |
| `--font-family` | `--font-sans` | `font-sans` (loaded via `next/font/google`, not a `<link>` tag) |
| `--spacing-xs..2xl` | same names, **plain CSS variables, not a theme key** (see pitfall below) | not a utility — use `var(--spacing-md)` or `p-[var(--spacing-md)]` |

Also added (no legacy equivalent, needed for the dashboard/toast UI already in `frontend/`): `--toast-success/error/warning/info`, `--auth-banner-*`, `--header*`, `--sidebar*` (shadcn's sidebar slot convention).

### Pitfall: don't put named sizes in `--spacing-*`

Tailwind v4 resolves **named** `max-w-*`, `w-*`, `h-*` sizes through the same `--spacing-{name}` namespace used for padding/margin/gap. Defining `--spacing-md: 16px` inside `@theme`/`@theme inline` silently changes `max-w-md` from Tailwind's default `28rem` to `16px` — no error, just a visually broken layout (found while building the Phase 2 preview page: a card collapsed to a sliver because it used `max-w-md`). That's why `--spacing-xs..2xl` are declared as plain `:root` CSS variables outside the theme block, not as theme keys — same behavior as the legacy `var(--spacing-md)` usage, no Tailwind utility generated for them.

