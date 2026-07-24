# Design — Typography

## Font

- Primary: `Inter`
- Fallback: `-apple-system, BlinkMacSystemFont, sans-serif`

## Guidelines

- Consistent hierarchy (title > labels > body)
- Readability: line-height ~ 1.4–1.6 for text

## apps/web (Next.js)

Same font (Inter), loaded via `next/font/google` in `apps/web/app/layout.tsx` instead of a Google Fonts `<link>` tag — self-hosted by Next at build time (no runtime request to Google, no layout shift while the font loads). Exposed as `--font-sans` and the `font-sans` Tailwind utility, matching the `--font-family` token by value.

