# Design — Tokens

Single source of truth for the tokens (CSS variables) used in this project. For every swatch
rendered live against the current theme, see [`/styleguide`](/styleguide)`#foundations-colors`.

The palette is called **Olival** and is derived from the product's own assets rather than picked in the abstract: the logo is an olive tree (Oliveira — the company's name), and the auth/landing banner is a construction site at golden hour. Olive is the primary, ink is the chrome, amber is the signal colour (a site vest, the sunset), and the page ground is a warm limestone rather than a cool grey.

## CSS Variables (light)

```css
:root {
  color-scheme: light;

  /* Ground and ink */
  --background: #f4f1ec;
  --foreground: #16201c;
  --card: #ffffff;

  /* Olive — primary */
  --primary: #4f6b3a;
  --primary-hover: #35492a;
  --primary-light: rgba(79, 107, 58, 0.1);
  --primary-foreground: #ffffff;

  --muted-foreground: #5a6560;
  --text-muted: #8a938d;

  /* Amber — signal colour. --signal-strong is for text (--signal alone fails
     AA at ~3.4:1 on the light background); --signal is for fills and marks. */
  --signal: #c8791f;
  --signal-strong: #8a5210;
  --signal-light: rgba(200, 121, 31, 0.12);

  /* Clay — destructive */
  --destructive: #b4442e;
  --destructive-foreground: #ffffff;
  --destructive-light: rgba(180, 68, 46, 0.1);

  --border: #dcd6cb;
  --border-focus: #4f6b3a;
  --ring: #4f6b3a;

  /* Header/sidebar chrome */
  --header: #16201c;
  --sidebar: #1b2621;
  /* 0.58 reads ~5.5:1 against --sidebar; below 0.5 fails WCAG AA for text. */
  --sidebar-section: rgba(244, 241, 236, 0.58);

  /* Typography */
  --font-display: 'Archivo';
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, monospace;

  /* Spacing (8px grid) */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

## Dark mode

A full `.dark` block exists with the same variable names, lifted for contrast rather than a literal inversion — `--primary` becomes `#8fb06a` (olive lightened to hold ~7:1 on the dark ground) rather than staying at the light-mode value, and `--signal-strong` becomes equal to `--signal` since amber itself is already legible on dark. See `apps/web/app/globals.css` for the full block. Theme switching is `next-themes` (`attribute="class"`, `defaultTheme="light"`, `enableSystem`), wired in `apps/web/app/layout.tsx`.

## Rules

- Always reuse tokens; avoid hardcoding values.
- When you need a recurring new value (e.g. overlay/banner), create a semantic token.
- A colour used as **text** must be checked against WCAG AA independently of how it reads as a fill — this is why `--signal` and `--signal-strong` are two different tokens instead of one used for both roles.

### Tint tokens (`-light`)

`--primary-light` and `--signal-light` are each a soft fill for their colour — the colour's own hex
at a low, per-theme-tuned opacity (light ~10-12%, dark ~14-16%, since a flat opacity value reads
differently against a light vs. a dark ground). `--destructive-light`,
`--toast-success-light`, `--toast-error-light`, `--toast-warning-light` and `--toast-info-light`
follow the same technique — every semantic colour that needs a badge/pill fill now has one, so
nothing reaches for an ad-hoc `bg-destructive/10`-style opacity suffix instead of a named token.

## Tailwind mapping (apps/web)

Re-expressed in `apps/web/app/globals.css` for Tailwind v4 (`@theme inline`), using shadcn/ui's standard slot names where one exists so shadcn components work unmodified (`bg-background`, `bg-primary`, `text-muted-foreground`, `border-border`, the `sidebar-*` family, …). Project-specific extensions: `--color-signal` / `--color-signal-strong` / `--color-signal-light`, `--color-toast-*`, `--color-auth-banner-*`, `--color-header*`, `--color-sidebar*`.

### Pitfall: don't put named sizes in `--spacing-*`

Tailwind v4 resolves **named** `max-w-*`, `w-*`, `h-*` sizes through the same `--spacing-{name}` namespace used for padding/margin/gap. Defining `--spacing-md: 16px` inside `@theme`/`@theme inline` silently changes `max-w-md` from Tailwind's default `28rem` to `16px` — no error, just a visually broken layout. That's why `--spacing-xs..2xl` are declared as plain `:root` CSS variables outside the theme block. In practice the app now reaches for Tailwind's native spacing scale (`gap-6`, `px-8`, …) rather than `var(--spacing-md)` almost everywhere — the plain variables remain available for the rare case a value needs to match the legacy 8px-grid names exactly.

### Structural device: the measured rule

`.measured-rule` (defined in `globals.css` under `@layer components`) is a hairline with a small olive tick at its leading edge — borrowed from the title block of a technical drawing. It marks the boundary under a page header or a field-group legend. It is the one repeated structural device in the interface; it should only ever mark a real section boundary, never decorate one.
