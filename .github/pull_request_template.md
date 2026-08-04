<!--
Title: use the same Conventional Commit form as the commits themselves —
feat: / fix: / docs: / refactor: / chore: / ci:, with an optional scope.
Base branch: develop. Only a release PR targets main.
-->

## Summary

<!-- What changed and why. Write for a reviewer who did not follow the work. -->

Closes #

## Type

<!-- Keep the one that applies. -->

- [ ] Feature — new behaviour
- [ ] Fix — something behaved differently from what it should
- [ ] Refactor — behaviour unchanged
- [ ] Docs
- [ ] Chore / CI / tooling

## How to verify

<!--
The steps a reviewer follows to see this working, not a description of the code.
Automated tests are a separate, deliberate phase of this project
(docs/qa/testing-status.md) — verification here is manual and that is expected.
-->

## Checklist

- [ ] `npm run lint && npm run format && npm run typecheck` clean
- [ ] `npm run build -w apps/web` clean, when `apps/web` is touched
- [ ] `npm run dev:doctor` clean, with no orphaned or duplicate dev servers
- [ ] Clicked through the affected screens in a browser
- [ ] New interactive elements carry a `data-testid`, registered in `docs/qa/testids.md`
- [ ] `prisma/schema.prisma` changes come with a migration, and the seed still runs
- [ ] Non-obvious decisions taken here are recorded as an ADR in `docs/adr/`, listed in its index
- [ ] Documentation affected by this change is updated in this same PR
- [ ] Everything technical is in English — identifiers, files, routes, and user-facing copy

## Notes for the reviewer

<!-- Trade-offs taken, alternatives rejected, anything deliberately left out. Optional. -->
