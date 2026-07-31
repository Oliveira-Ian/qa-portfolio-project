# Design — Components — Cards

- Cards must use `--card`, `--radius-lg`, `--shadow-card`
- Limit width for forms (e.g. 420px) when it makes sense

## apps/web (Next.js)

Most surfaces in the current UI are a plain `div` styled directly (`rounded-lg border border-border bg-card shadow-card`) rather than the shadcn `Card` primitive — record sheets, the people table, and page sections all follow this pattern so the surrounding header/footer regions (the record cartouche, the field-group legends) can be laid out without fighting `Card`'s built-in padding model. `apps/web/components/ui/card.tsx` (shadcn's `Card`/`CardHeader`/`CardTitle`/`CardContent`/`CardFooter`) is still used for compact, self-contained pieces — see the form preview on `/styleguide`.
