# 0010 — Versioning, releases and image publishing

## Context

ADR 0009 fixed the branch model (`feature/* → develop → main`, `main` tagged) but left three things
open: how a version number is chosen, how a release is actually cut, and what happens to the Docker
images. In practice `main` held one tag (`v1.0.0`), there were no GitHub Releases, no changelog, every
`package.json` said `0.0.0`, and nothing was published anywhere.

Two properties of the repository made the ADR 0009 model impossible to run as written:

- **The `main` ruleset allowed only squash merges and required linear history.** A squash of
  `develop` into `main` writes a commit that never exists on `develop`. The next promotion would
  then replay commits that were already released, and release tags would not appear in `develop`'s
  history.
- **Both rulesets required one approving review, with a single collaborator.** Nobody can approve
  their own pull request, so every PR was blocked — and so would every release PR opened by a bot
  running as that same person. No ruleset required CI to pass, so the check that would matter was
  not enforced at all.

## Decision

**The ADR 0009 branch model is kept.** `develop` integrates, `main` is stable, work branches are one
per issue and are deleted after merge. Added: `hotfix/<issue>-<slug>` branches cut from `main`, and
no `release/*` branches.

**One SemVer version for the whole product.** `apps/web`, `apps/api` and `packages/schemas` ship
together as one compose stack and are coupled through the shared schemas, so per-app versions would
describe combinations that never run. Numbering continues from `v1.0.0`.

**The version is derived, not chosen.** Pull request titles must be Conventional Commits
(`.github/workflows/pr-validation.yml`), PRs into `develop` are squash-merged with the title as the
commit message, and release-please computes the next version from those messages on `main`: `fix` is
PATCH, `feat` is MINOR, `!` or `BREAKING CHANGE` is MAJOR. Commit-time tooling (commitlint, husky) is
not added; the title check covers the only message that reaches `main`.

**Releasing is a deliberate act with two merges.** Promoting `develop` to `main` is a PR opened on
request. release-please then opens a release PR (version bump and `CHANGELOG.md`); merging it creates
the `vX.Y.Z` tag and the GitHub Release. A plain merge never releases. The token is a fine-grained PAT
stored as `RELEASE_PLEASE_TOKEN`, because PRs opened by `GITHUB_TOKEN` do not trigger the required CI.

**Merge methods follow the graph.** Work into `develop` and hotfix and release PRs into `main` are
squashed. `develop → main` and the post-release `main → develop` sync are merge commits — the only
way to keep the two branches on one shared history. The `main` ruleset therefore allows merge commits
and no longer requires linear history.

**Images are published to Docker Hub only when a Release is created**, as
`ianoliveira14/oliveira-foundation-web` and `-api`, tagged `X.Y.Z`, `X.Y`, `X`, `latest` and
`sha-<commit>`, with OCI labels for revision, version and source. They are built from the released
commit and scanned with Trivy before the push. A version that already exists on Docker Hub is never
overwritten. Deployment is not part of this decision.

**Rulesets enforce CI instead of people.** Required approvals drop to 0 while there is one
maintainer, and the CI checks become required status checks on both `main` and `develop`. When a
second collaborator joins, approvals go back to 1.

## Consequences

- **Every commit that reaches `main` must have a Conventional title.** A wrong type produces a wrong
  number; the fix is visible in the release PR before anything is published.
- **`main` and `develop` stay joined by merge commits**, at the price of a slightly noisier graph on
  `main` and one sync PR after each release.
- **The release workflow depends on a PAT that expires.** When it does, the release-please step
  fails cleanly; nothing is released half-way. The expiry date is a maintenance item
  (`docs/process/versioning.md`).
- **Required approvals of 0 mean the branch rules rest on CI.** The pipeline must stay trustworthy:
  a check that is flaky or disabled weakens every merge.
- **`docker-dev.yml` and `release.yml` both scan images with Trivy**, report-only for now. The
  planned move to blocking on HIGH/CRITICAL applies to both.
- **Published Releases are immutable** (repository setting), so a bad release is fixed forward with a
  new PATCH, never edited.
- ADR 0009 is not superseded: it still governs the branch model and the issue hierarchy. Where the
  two touch — the tagging of `main` — this ADR is the detail.
