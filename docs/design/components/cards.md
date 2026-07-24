# Design — Components — Cards

- Cards must use `--bg-card`, `--radius-lg`, `--shadow-card`
- Limit width for forms (e.g. 420px) when it makes sense

## apps/web (Next.js)

Use shadcn/ui's `Card` (`apps/web/components/ui/card.tsx`, with `CardHeader`/`CardTitle`/`CardContent`/`CardFooter`). Its own default (`rounded-xl`, no shadow) doesn't match this doc — apply the tokens explicitly at the call site:

```tsx
<Card className="max-w-md rounded-lg shadow-card">...</Card>
```

`bg-card` is already shadcn's default, no override needed there.

