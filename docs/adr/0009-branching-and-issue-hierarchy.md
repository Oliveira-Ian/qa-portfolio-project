# 0009 — Branching model and the Epic/Feature/Task hierarchy

## Context

The repository had strong code conventions — Conventional Commits, the ADR format, the `data-testid`
standard, the routine template — and no collaboration workflow at all: no issues, no feature branches,
no merges in its history, no CONTRIBUTING, no pull request or issue templates. All work happened
directly on a branch named `develop-v2`, created for the v2 stack migration, while `main` sat frozen
for months.

Meanwhile the Foundation roadmap defines 25 modules to be built over years, with an explicit rule that
a module is specified before it is implemented. Tracking that in a single long-lived branch, with the
plan living only in a document outside the repository, does not survive the first time two things are
in flight at once — or the first other person.

GitHub has no native Epic. It does have sub-issues, which nest, so the hierarchy has to be expressed
through them plus labels.

## Decision

**Branching: `feature/* → develop → main`.**

`main` is stable and receives only releases, through a pull request, each tagged with a semver tag.
`develop` is the integration branch and receives everything else. Work branches are created from
`develop`, one per issue, named `<type>/<issue-number>-<slug>` where the type matches the Conventional
Commit types already in use — so the branch, the commits and the pull request title all say the same
thing.

The transition to this model was itself done through the model: the v2 work reached `main` via pull
request #1, `main` was tagged `v1.0.0` as the baseline, `develop` was branched from it, and
`develop-v2` was deleted once its commits were verified to be fully contained in `main`.

**Hierarchy: Epic → Feature → Task, as nested sub-issues, distinguished by a `type:` label.**

An Epic is one roadmap module and is a container — never implemented directly, done when its Features
are done. A Feature is a vertical slice that delivers observable behaviour end to end: database, API,
UI, permission and documentation together. A Task is an executable unit inside a Feature, usually one
layer or one screen.

**Tasks are created only after their Feature is specified**, and a Feature that cannot be specified
because something has not been decided carries `needs-decision` and does not move. Guessing and
proceeding is how a foundation acquires rules nobody chose.

The board tracks Features and Tasks only; Epics are excluded and live in a separate view grouped by
milestone, where GitHub's sub-issue progress bar shows how far each module has come.

## Consequences

- **Two long-lived branches instead of one** means a release is a deliberate act with its own pull
  request and tag, rather than whatever happens to be on the trunk. The cost is one extra merge per
  release, paid on purpose: the Foundation is meant to be consumed by other products, which need to
  depend on something that does not move under them.
- **`.github/workflows/ci.yml` tracks `[main, develop]`.** Any future rename of an integration branch
  has to update it, or the workflow silently stops running on pushes.
- **Blank issues are disabled.** Work that fits none of the four templates is usually not ready to be
  tracked; the templates are the specification checklist, not paperwork.
- **The board's columns carry stated exit criteria** (`docs/process/development-workflow.md`).
  Eight columns without them would be decoration.
- **This is written as a reusable standard**, not a habit of this repository — a second Platform
  project should be able to adopt it by copying `.github/` and that document.
- **Priority labels are deliberately absent.** Column order and milestone already express priority;
  a third source would only contradict them. They can be added if they are genuinely missed.
