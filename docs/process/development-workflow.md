# Development Workflow

How work is planned, tracked, built and shipped in this repository — from a line on the roadmap to a
merged pull request.

This is written to be **reusable**: it describes a standard for the Oliveira Platform, not a habit of
one repository. A second project should be able to adopt it by copying `.github/` and this document.

Related: `docs/adr/0009-branching-and-issue-hierarchy.md` records *why* this shape was chosen.
`docs/index.md` routes to everything else.

---

## 1. The hierarchy

Four levels. Each one answers a different question, and mixing them is the most common way a board
stops being useful.

| Level | What it is | Lives as | Lasts |
|---|---|---|---|
| **Roadmap** | The ordered list of Foundation modules | A document | The life of the product |
| **Epic** | One module | An issue, `type: epic` | Weeks |
| **Feature** | A vertical, deliverable slice of a module | A sub-issue of the Epic, `type: feature` | Days |
| **Task** | An executable unit inside a Feature | A sub-issue of the Feature, `type: task` | Hours |

**An Epic is a container.** It is never implemented directly and never moves across the board on its
own — it is done when its Features are done. GitHub's sub-issue progress bar is what shows how far a
module has come.

**A Feature is vertical.** It delivers observable behaviour end to end: database, API, UI, permission
and documentation together. "Add the repository method" is not a Feature; it is a Task. The one
deliberate exception is shared infrastructure — a change several modules depend on, executed once —
which is a Feature precisely because it is *not* vertical, and says so in its own description.

**A Task exists only inside a specified Feature.** Tasks are created when the Feature is specified,
not before. A backlog full of tasks for work nobody has thought through yet is a backlog of guesses.

### Two rules that keep this honest

1. **No Task is created before its Feature is specified.** Specification means the Feature issue's
   fields are filled from a real decision, not inferred.
2. **A pending decision is a blocker, not an assumption.** If a Feature cannot be specified because
   something has not been decided, it carries `needs-decision` and stays where it is. Guessing and
   moving on is how a foundation acquires rules nobody chose.

---

## 2. Labels

Prefixed so they group in the list. Every issue carries exactly one `type:`, at least one `area:`,
and any number of the rest.

### `type:` — what this is

| Label | Use |
|---|---|
| `type: epic` | A roadmap module |
| `type: feature` | A vertical slice of a module |
| `type: task` | An executable unit inside a Feature |
| `type: bug` | Behaviour differs from what it should be |
| `type: docs` | Documentation only |
| `type: refactor` | Behaviour unchanged |
| `type: chore` | Tooling, dependencies, CI |

### `area:` — where the work happens

| Label | Scope |
|---|---|
| `area: web` | `apps/web` |
| `area: api` | `apps/api` |
| `area: data` | `prisma/` — schema, migrations, seed |
| `area: shared` | `packages/*` |
| `area: infra` | Docker, CI, scripts, tooling |
| `area: docs` | `docs/` and root documentation |

### Concerns — cross-cutting, combine with any type

`security` · `technical-debt` · `accessibility` · `performance`

### Flow — temporary states

| Label | Meaning |
|---|---|
| `blocked` | Cannot proceed for an external reason. The comment says what is being waited on |
| `needs-decision` | Waiting on a decision that is not ours to assume |
| `needs-spec` | A Feature that has not been specified yet. It cannot leave **Analysis** while this is on |

**There are no priority labels.** Column order and milestone already express priority; a third source
only creates contradictions. Add them when they are genuinely missed, not before.

---

## 3. Milestones

One per roadmap phase, in sequence. A milestone is temporal — it closes. Thematic groupings belong to
labels, not milestones.

Milestones carry no due dates: the roadmap is ordered, not scheduled.

---

## 4. The board

The project board tracks **Features and Tasks**. Epics are excluded from it and live in their own
view, grouped by milestone — otherwise they would sit in a column for months without meaning
anything.

| Column | What it means | What moves it forward |
|---|---|---|
| **Backlog** | Accepted, not started | Someone picks it up |
| **Analysis** | Being specified — requirements, rules, flows, screens, permissions | The Feature issue is filled and `needs-spec` is removed |
| **Ready for Development** | Specified and unblocked. Anyone could pick it up and start | A branch is created from the issue |
| **In Development** | Being built | A pull request is opened |
| **Code Review** | PR open, CI green, waiting on review | Review approved |
| **Ready for QA** | Merged or ready to verify, not yet verified | Someone starts verifying |
| **In QA** | Being verified against the acceptance criteria | Criteria met |
| **Done** | Merged and verified | — |

A card that fails review goes back to **In Development**. A card that fails QA goes back to **In
Development**, not to Backlog — the specification did not change, the implementation did.

---

## 5. Branches

```
feature/* ─→ develop ─→ main
```

- **`main`** — stable. Receives only releases, through a pull request, and every release is tagged.
- **`develop`** — integration. Everything lands here first.
- **Work branches** — created from `develop`, one per issue, deleted after merge.

### Naming

```
<type>/<issue-number>-<short-slug>
```

`feature/42-company-entity` · `fix/58-login-redirect` · `docs/61-workflow-standard` ·
`refactor/70-person-repository` · `chore/73-bump-prisma`

The types match the Conventional Commit types below, so the branch, the commits and the PR title all
say the same thing. Slugs are lowercase and kebab-case, like every other identifier in this project.

---

## 6. Commits

[Conventional Commits](https://www.conventionalcommits.org/), in English, with an optional scope:

```
feat(web): add company switcher to the header
fix(api): scope the last-admin guard to the caller's company
docs(adr): record the multi-tenancy decision as ADR 0008
refactor(ui): extract the shared filter field
chore: bump prisma to 5.22
ci: track develop instead of develop-v2
```

The body explains **why**, not what — the diff already says what. Reference the ADR or document that
justifies a non-obvious choice.

Commits are atomic. One commit that changes the schema, the API and the UI is three commits.

---

## 7. From issue to merge

1. **Issue** — pick a card in *Ready for Development*.
2. **Branch** — create it from the issue on GitHub ("Create a branch" links them automatically) or
   locally from `develop`, following the naming above.
3. **Build** — commit as you go. Move the card to *In Development*.
4. **Pull request** — target `develop`. Fill the template; `Closes #NN` links it so the issue closes
   on merge. Move the card to *Code Review*.
5. **CI** — five jobs run on every PR: lint and typecheck, unit tests, API tests, E2E tests, and a
   Docker Compose build. A red PR is not reviewed.
6. **Review** — against the acceptance criteria and the conventions, not just the diff.
7. **QA** — verify the acceptance criteria in a running application. Automated coverage is a separate,
   deliberate phase of this project (`docs/qa/testing-status.md`); until it lands, verification here
   is manual and that is expected, not a gap in the process.
8. **Merge** — into `develop`. Delete the branch.

### Releases

When `develop` holds a coherent set of changes, open a pull request from `develop` to `main`. Merge
it, tag `main` with a semver tag (`v1.1.0`), and write the release notes from the merged PRs.

---

## 8. Opening new work

| You have | Open |
|---|---|
| A roadmap module reaching the horizon | **Epic** |
| A slice of a module that delivers behaviour | **Feature**, as a sub-issue of its Epic |
| A step inside a Feature that is already specified | **Task**, as a sub-issue of its Feature |
| Something behaving differently from what it should | **Bug** |

Blank issues are disabled on purpose. If none of the templates fits, the work is probably not ready
to be tracked yet.

### When it deserves an ADR

`docs/adr/README.md` sets the trigger: a decision non-obvious enough that a future reader would
otherwise have to reconstruct the reasoning from a diff. Add the record and the line in the index
table, in the same pull request as the change.

An ADR records the **decision and what is expected to follow from it**. It is not a specification:
the data model, business rules and flows are settled in the module's own specification, and every
consequence an ADR lists is confirmed or adjusted there before anything is implemented.
