# Project subagents

Custom subagents for this repo. Any file here with a `name:` in its frontmatter becomes selectable
as `subagent_type` in the `Agent` tool, the same way built-in agents (`Explore`, `Plan`, ...) are.

## Roster

- `code-reviewer` — standards/architecture compliance review of a diff against this repo's
  documented conventions. See `code-reviewer.md`.
- `security-reviewer` — reviews diffs against this project's specific auth model (JWT/cookie
  session, role/profile/permission system). See `security-reviewer.md`.
- `performance-reviewer` — reviews diffs for Next.js/Prisma-specific performance issues (Server/
  Client Component boundaries, N+1 queries). See `performance-reviewer.md`.
- `architecture-reviewer` — deeper module-design judgement (coupling, cohesion, misplaced
  responsibility) on a specific diff, complementing `code-reviewer`. See `architecture-reviewer.md`.
- `qa-reviewer` — reviews test quality/coverage against this repo's testing conventions; never
  writes or fixes tests itself. See `qa-reviewer.md`.

## Conventions for adding a new specialist

- **Single responsibility.** One clearly-scoped concern per agent — don't grow an existing agent to
  cover a second concern; add a new file instead.
- **Read source-of-truth files at invocation time**, don't embed copies of `.claude/rules/*.md` or
  `docs/` content in the agent's own prompt — one edit to the rules then keeps every agent in sync
  instead of drifting.
- **Read-only by default.** Give `tools: Read, Grep, Glob, Bash` unless the task genuinely needs to
  write; reviewers review, they don't fix.
- **Wire into skills instead of duplicating them.** If an existing skill (e.g. `/code-review`) has a
  step that matches a new agent's specialty, point that step at the new `subagent_type` rather than
  building a parallel review flow.
