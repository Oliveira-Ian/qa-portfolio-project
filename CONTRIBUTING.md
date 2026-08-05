# Contributing

Start here, then read the document that matches what you are about to do.

## Getting the project running

`docs/index.md` has the Quick Start for `apps/api`, `apps/web` and the full Docker Compose stack, plus
the index of every other rule in the project. Do not duplicate setup steps here — that index is the
single entry point.

## Before you change anything

| You are changing                                   | Read                                   |
| -------------------------------------------------- | -------------------------------------- |
| How work is planned, branched, reviewed and merged | `docs/process/development-workflow.md` |
| UI, tokens, typography, layouts, components        | `docs/design/`                         |
| A listing screen, or adding a new routine          | `docs/templates/new-routine.md`        |
| API responses, errors, status codes                | `docs/api/http_responses.md`           |
| Auth, roles, profiles, permissions                 | `docs/product/access_control.md`       |
| Test selectors                                     | `docs/qa/testids.md`                   |
| Why something is built the way it is               | `docs/adr/`                            |

The coding standards themselves — file structure, the Server Component / Server Action / data-access
layering, naming, forms, and the English-only language standard — live in
`.claude/rules/rules-global.md`.

Claude Code sessions in this repo also run automated guards — confirmation before destructive
commands or edits to sensitive files, and a note after editing config/infra files that need a
manual next step. What each one does is documented in its own file: `.claude/hooks/` (wired up in
`.claude/settings.json`).

## The short version of the workflow

```
Issue → branch from develop → commits → PR into develop → CI → review → QA → merge
```

- Branches: `<type>/<issue-number>-<slug>`, e.g. `feature/42-company-entity`
- Commits: Conventional Commits in English, e.g. `feat(web): add company switcher`
- Pull requests target `develop`. Only a release PR targets `main`, and it is tagged
- `main` is stable; `develop` is integration

Full detail, including what each board column means and when something deserves an ADR:
`docs/process/development-workflow.md`.

## Two rules worth knowing up front

**Automated tests are a separate phase.** Do not write or repair test suites unless the work is
explicitly about testing — `docs/qa/testing-status.md` explains what is active, what is disabled in
place, and why. Verification today is manual and that is deliberate.

**Everything technical is in English.** Folder and file names, routes, identifiers, database columns,
seeded values, and user-facing copy. This is a hard rule
(`.claude/rules/rules-global.md`, "Language Standard") — the one exception is conversation.

## Before opening a pull request

The pull request template carries the full checklist. The essentials:

```bash
npm run lint && npm run format && npm run typecheck
npm run build -w apps/web    # when apps/web is touched
npm run dev:doctor           # no orphaned or duplicate dev servers
```

Then click through the screens you touched in a browser, and leave the dev servers running.
