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

